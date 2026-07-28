import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";

const baseSha = process.env.MIGRATION_BASE_SHA ?? process.argv[2];

if (!baseSha) {
  throw new Error(
    "Provide MIGRATION_BASE_SHA or pass the pull request base SHA as an argument.",
  );
}

const migrationPaths = execFileSync(
  "git",
  ["ls-tree", "-r", "--name-only", baseSha, "--", "db/migrations"],
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

const immutableMigrationPaths = migrationPaths.filter(
  (path) =>
    path.endsWith(".sql") ||
    /^db\/migrations\/meta\/\d+_snapshot\.json$/.test(path),
);

function readCurrentFile(path) {
  let currentContents;

  try {
    currentContents = readFileSync(path);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }

  return currentContents;
}

const violations = immutableMigrationPaths.flatMap((path) => {
  const currentContents = readCurrentFile(path);

  if (!currentContents) {
    return [`D\t${path}`];
  }

  const baseContents = execFileSync("git", ["show", `${baseSha}:${path}`]);

  return currentContents.equals(baseContents) ? [] : [`M\t${path}`];
});

const journalPath = "db/migrations/meta/_journal.json";

if (migrationPaths.includes(journalPath)) {
  const currentJournalContents = readCurrentFile(journalPath);

  if (!currentJournalContents) {
    violations.push(`D\t${journalPath}`);
  } else {
    const baseJournal = JSON.parse(
      execFileSync("git", ["show", `${baseSha}:${journalPath}`], {
        encoding: "utf8",
      }),
    );
    const currentJournal = JSON.parse(currentJournalContents.toString("utf8"));
    const { entries: baseEntries, ...baseHeader } = baseJournal;
    const { entries: currentEntries, ...currentHeader } = currentJournal;
    const preservesHeader = isDeepStrictEqual(currentHeader, baseHeader);
    const preservesEntries =
      Array.isArray(baseEntries) &&
      Array.isArray(currentEntries) &&
      currentEntries.length >= baseEntries.length &&
      isDeepStrictEqual(
        currentEntries.slice(0, baseEntries.length),
        baseEntries,
      );

    if (!preservesHeader || !preservesEntries) {
      violations.push(`M\t${journalPath}`);
    }
  }
}

if (violations.length > 0) {
  console.error(
    "Existing migration SQL and snapshots are immutable, and journal history is append-only. Add a new migration instead:",
  );
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("Migration artifact immutability check passed.");
