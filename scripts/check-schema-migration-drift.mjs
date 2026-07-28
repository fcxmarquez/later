import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative } from "node:path";

const projectRoot = process.cwd();
const migrationsDirectory = join(projectRoot, "db", "migrations");
const temporaryRoot = mkdtempSync(
  join(tmpdir(), "later-schema-migration-drift-"),
);
const temporaryMigrationsDirectory = join(temporaryRoot, "migrations");

function snapshotDirectory(directory) {
  const snapshot = new Map();
  const pendingDirectories = [directory];

  while (pendingDirectories.length > 0) {
    const currentDirectory = pendingDirectories.pop();

    for (const entry of readdirSync(currentDirectory, {
      withFileTypes: true,
    })) {
      const absolutePath = join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        pendingDirectories.push(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const relativePath = relative(directory, absolutePath);
      const hash = createHash("sha256")
        .update(readFileSync(absolutePath))
        .digest("hex");

      snapshot.set(relativePath, hash);
    }
  }

  return snapshot;
}

function describeChanges(before, after) {
  const paths = new Set([...before.keys(), ...after.keys()]);

  return [...paths].sort().flatMap((path) => {
    if (!before.has(path)) {
      return [`A\t${path}`];
    }

    if (!after.has(path)) {
      return [`D\t${path}`];
    }

    return before.get(path) === after.get(path) ? [] : [`M\t${path}`];
  });
}

try {
  cpSync(migrationsDirectory, temporaryMigrationsDirectory, {
    recursive: true,
  });

  const before = snapshotDirectory(temporaryMigrationsDirectory);
  const temporaryMigrationsArgument = relative(
    projectRoot,
    temporaryMigrationsDirectory,
  );
  const drizzleKitExecutable = join(
    projectRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "drizzle-kit.cmd" : "drizzle-kit",
  );
  const result = spawnSync(
    drizzleKitExecutable,
    [
      "generate",
      "--schema",
      join(projectRoot, "db", "schema.ts"),
      "--out",
      temporaryMigrationsArgument,
      "--dialect",
      "postgresql",
      "--name",
      "schema-drift-check",
    ],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
    },
  );

  if (result.error) {
    throw result.error;
  }

  const drizzleOutput = `${result.stdout}\n${result.stderr}`;

  if (result.status !== 0 || /(^|\n)(Error|TypeError):/m.test(drizzleOutput)) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(
      `Drizzle schema drift check failed with exit code ${result.status}.`,
    );
  }

  const after = snapshotDirectory(temporaryMigrationsDirectory);
  const changes = describeChanges(before, after);

  if (changes.length > 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    console.error("Drizzle schema and committed migrations are out of sync.");
    console.error(changes.join("\n"));
    console.error(
      "Run `pnpm run db:generate`, review the SQL, and commit the generated migration artifacts.",
    );
    process.exitCode = 1;
  } else {
    console.log(
      `${basename(join(projectRoot, "db", "schema.ts"))} and committed migrations are in sync.`,
    );
  }
} finally {
  rmSync(temporaryRoot, { force: true, recursive: true });
}
