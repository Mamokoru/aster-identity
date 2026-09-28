import "server-only";

import { Pool } from "pg";

declare global {
  var asterDatabasePool: Pool | undefined;
}

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required database setting: ${name}`);
  }

  return value;
}

function createPool(): Pool {
  const sslMode = process.env.PGSSLMODE ?? (process.env.NODE_ENV === "production" ? "verify-full" : "disable");
  const port = Number(process.env.PGPORT ?? "5432");

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PGPORT must be a valid TCP port.");
  }

  return new Pool({
    host: requiredEnvironmentValue("PGHOST"),
    port,
    database: requiredEnvironmentValue("PGDATABASE"),
    user: requiredEnvironmentValue("PGUSER"),
    password: requiredEnvironmentValue("PGPASSWORD"),
    ssl: sslMode === "disable" ? false : { rejectUnauthorized: true },
    max: 8,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

export function getDatabasePool(): Pool {
  asterDatabasePool ??= createPool();
  return asterDatabasePool;
}