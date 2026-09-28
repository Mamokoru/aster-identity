import "server-only";

import type { PoolClient } from "pg";
import { getDatabasePool } from "@/lib/db";

interface KeycloakUser {
  subject: string;
  email: string | null;
  displayName: string | null;
}

async function withTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getDatabasePool().connect();

  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function recordKeycloakSignIn(user: KeycloakUser): Promise<void> {
  if (!user.subject) {
    throw new Error("Keycloak did not provide a subject for the signed-in user.");
  }

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO app.app_users (keycloak_subject, email, display_name, last_authenticated_at)
       VALUES ($1, $2, $3, clock_timestamp())
       ON CONFLICT (keycloak_subject) DO UPDATE
       SET email = COALESCE(EXCLUDED.email, app.app_users.email),
           display_name = COALESCE(EXCLUDED.display_name, app.app_users.display_name),
           last_authenticated_at = clock_timestamp()`,
      [user.subject, user.email, user.displayName],
    );

    await client.query(
      `INSERT INTO app.auth_audit_events (event_type, actor_subject, outcome, details)
       VALUES ('authentication.succeeded', $1, 'success', $2::jsonb)`,
      [user.subject, JSON.stringify({ provider: "keycloak" })],
    );
  });
}

export async function recordLocalSignOut(subject: string): Promise<void> {
  await getDatabasePool().query(
    `INSERT INTO app.auth_audit_events (event_type, actor_subject, outcome, details)
     VALUES ('authentication.signed_out', $1, 'success', $2::jsonb)`,
    [subject, JSON.stringify({ sessionType: "authjs-jwt" })],
  );
}

export async function authorizeAppRole(input: {
  subject: string | null;
  requiredRole: string;
  resource: string;
  action: string;
}): Promise<boolean> {
  return withTransaction(async (client) => {
    let allowed = false;

    if (input.subject) {
      const result = await client.query<{ allowed: boolean }>(
        `SELECT EXISTS (
           SELECT 1
           FROM app.app_users AS users
           JOIN app.user_roles AS roles ON roles.user_id = users.id
           WHERE users.keycloak_subject = $1
             AND roles.role_name = $2
         ) AS allowed`,
        [input.subject, input.requiredRole],
      );

      allowed = result.rows[0]?.allowed ?? false;
    }

    await client.query(
      `INSERT INTO app.auth_audit_events
         (event_type, actor_subject, resource, action, outcome, details)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        allowed ? "authorization.granted" : "authorization.denied",
        input.subject,
        input.resource,
        input.action,
        allowed ? "success" : "denied",
        JSON.stringify({ requiredRole: input.requiredRole }),
      ],
    );

    return allowed;
  });
}