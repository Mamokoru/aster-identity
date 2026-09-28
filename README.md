# Aster Authentication Starter

Next.js App Router authentication starter using Keycloak OIDC and PostgreSQL for application identity mappings, authorization roles, and audit events. Keycloak remains responsible for passwords, passkeys, MFA, and identity-provider sessions.

## Local Setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and set local database and Keycloak values. `.env.local` is ignored by Git; never commit it or share its contents.
3. Use a separate PostgreSQL database for this app, such as `aster_auth`. Do not point this app at Keycloak's internal database.
4. Set `PGUSER` and `PGPASSWORD` to a restricted application role. Set `PGMIGRATIONUSER` and `PGMIGRATIONPASSWORD` to a separate role allowed to create the app role and schema.
5. Apply the schema with `./scripts/apply-db-migration.ps1` from PowerShell.
6. Start the app with `pnpm dev` and open [http://localhost:3000](http://localhost:3000).

The runtime role needs access to the `app` schema tables granted by the migration. Successful Keycloak sign-ins upsert `app.app_users` and append audit events. Server-side role checks use `app.user_roles` and write allow/deny events to `app.auth_audit_events`.

Auth.js v4 sessions remain encrypted JWT cookies; PostgreSQL does not store session tokens. Signing out of the app does not end the separate Keycloak SSO session. Failed password/passkey attempts must be captured from Keycloak's event system; they do not pass through the app's sign-in event callback.

## Production Notes

- Use HTTPS for the app and Keycloak, configure exact production redirect URIs, and set a strong `NEXTAUTH_SECRET`.
- Set `PGSSLMODE=verify-full` for PostgreSQL connections in production. The `disable` value in `.env.example` is for local development only.
- Keep database roles least-privileged, rotate credentials, and protect backups. The audit trigger blocks edits through the app role; database administrators can still alter records. Export audit records to an independently controlled immutable archive when required.
- Legal obligations depend on deployment jurisdiction, data, and organization. This starter provides technical controls, not a certification or legal determination.
