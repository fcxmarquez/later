import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const baseSha = process.env.MIGRATION_BASE_SHA ?? process.argv[2];

if (!baseSha) {
  throw new Error(
    "Provide MIGRATION_BASE_SHA or pass the pull request base SHA as an argument.",
  );
}

const existingMigrations = execFileSync(
  "git",
  ["ls-tree", "-r", "--name-only", baseSha, "--", "db/migrations"],
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter((path) => path.endsWith(".sql"));

const violations = existingMigrations.flatMap((path) => {
  let currentContents;

  try {
    currentContents = readFileSync(path);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [`D\t${path}`];
    }

    throw error;
  }

  const baseContents = execFileSync("git", ["show", `${baseSha}:${path}`]);

  return currentContents.equals(baseContents) ? [] : [`M\t${path}`];
});

if (violations.length > 0) {
  console.error(
    "Existing migration SQL files are immutable. Add a new migration instead:",
  );
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("Migration SQL immutability check passed.");
