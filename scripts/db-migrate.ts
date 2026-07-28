import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import {
  isPooledDatabaseUrl,
  runMigrations,
  toDirectNeonDatabaseUrl,
} from "./db-migration-runner";

const vercelDeployment = process.argv.includes("--vercel");

if (!vercelDeployment) {
  loadEnv({ path: ".env.local", quiet: true });
  loadEnv({ quiet: true });
}

async function main() {
  const productionMigration = process.argv.includes("--production");
  const vercelEnvironment = process.env.VERCEL_ENV;

  if (
    vercelDeployment &&
    vercelEnvironment !== "production" &&
    vercelEnvironment !== "preview"
  ) {
    console.log(
      `Skipping Vercel migrations (VERCEL_ENV=${vercelEnvironment ?? "local"}).`,
    );
    return;
  }

  if (
    productionMigration &&
    vercelEnvironment !== "production" &&
    process.env.MIGRATION_TARGET !== "production"
  ) {
    throw new Error(
      "Production migrations require VERCEL_ENV=production or MIGRATION_TARGET=production.",
    );
  }

  const directDatabaseUrl =
    process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED;
  const configuredDatabaseUrl = process.env.DATABASE_URL;
  const derivedLocalDirectUrl =
    !vercelDeployment &&
    !productionMigration &&
    configuredDatabaseUrl &&
    isPooledDatabaseUrl(configuredDatabaseUrl)
      ? toDirectNeonDatabaseUrl(configuredDatabaseUrl)
      : undefined;
  const databaseUrl =
    directDatabaseUrl ?? derivedLocalDirectUrl ?? configuredDatabaseUrl;

  if (!databaseUrl) {
    if (vercelDeployment && vercelEnvironment === "preview") {
      console.log(
        "Skipping preview migrations (no preview database configured; guest mode remains available).",
      );
      return;
    }

    throw new Error(
      "No migration database configured. Set DATABASE_URL_UNPOOLED or MIGRATION_DATABASE_URL.",
    );
  }

  const requiresDirectConnection =
    productionMigration ||
    (vercelDeployment &&
      (vercelEnvironment === "production" || vercelEnvironment === "preview"));

  if (requiresDirectConnection && isPooledDatabaseUrl(databaseUrl)) {
    throw new Error(
      "Deploy migrations require a direct Postgres URL, not a pooled (-pooler) URL.",
    );
  }

  if (derivedLocalDirectUrl) {
    console.log(
      "Using the direct Neon endpoint derived from the local pooled URL.",
    );
  } else if (!directDatabaseUrl && isPooledDatabaseUrl(databaseUrl)) {
    console.warn(
      "Applying local migrations through a pooled URL. DATABASE_URL_UNPOOLED is recommended.",
    );
  }

  const migrationsFolder = resolve(process.cwd(), "db/migrations");

  console.log("Applying Drizzle migrations...");
  await runMigrations(databaseUrl, migrationsFolder);
  console.log("Migrations applied.");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
