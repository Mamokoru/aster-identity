# Aster Authentication Starter

Next.js App Router authentication starter using Keycloak OIDC and PostgreSQL for application identity mappings, authorization roles, and audit events. Keycloak remains responsible for passwords, passkeys, MFA, and identity-provider sessions.

## Goal

Provide a reusable, security-focused authentication starter that is straightforward to configure locally and has clear production-hardening guidance. OIDC delegates identity verification to an identity provider; PostgreSQL stores only application identity mappings, roles, and app-side audit events. The app must not collect or store users' passwords.

This is a technical security baseline, not a claim of legal compliance or certification. Applicable legal obligations depend on deployment location, organization, and the data being processed.

## Initial Compliance Targets

These are the security/compliance controls this project is initially designed to pursue. Status describes the current implementation, not a certification.

- **Identity verification:** OAuth 2.0 / OIDC through Keycloak is wired. MFA and passwordless passkeys using WebAuthn must be enabled and verified in the realm.
- **Data in transit:** HTTPS/TLS is required for production app and identity-provider endpoints. Local development uses HTTP; production deployment is not configured yet.
- **Least privilege:** OIDC is used for sign-in, and PostgreSQL has a restricted runtime role. The server-side app-role check exists but is not yet connected to protected application routes.
- **Account defense:** Keycloak brute-force detection and temporary lockout need to be configured and verified. CAPTCHA is not currently implemented.
- **Audit trails:** Successful app sign-ins, local sign-outs, and authorization decisions can be recorded in PostgreSQL. Failed login events still need to be forwarded from Keycloak. The database trigger prevents mutation through the app role, but administrator-proof immutability requires an external WORM archive.

## Current Progress

Implemented:

- Auth.js v4 Keycloak provider and App Router callback route, using the `aster` realm configuration from environment variables.
- Password/passkey handling delegated to Keycloak; the app sign-in action redirects to the provider.
- PostgreSQL pool with TLS verification by default in production, Keycloak subject-to-app-user mapping, and successful sign-in/local sign-out audit writes.
- Server-only role-check helper that denies by default and records authorization allow/deny events.
- PostgreSQL schema, append-only-for-the-app audit trigger, migration runner, and least-privilege runtime grants.
- Lint and production build pass. The OIDC redirect and database audit write permissions have been checked locally.

Still to do or verify:

- Complete a real Keycloak user sign-in and callback test; the full authentication round trip has not yet been verified with a test user.
- Configure and verify realm MFA/passkeys, brute-force protection, and Keycloak failed-login event capture.
- Call the role-check helper from protected application routes and define a role-provisioning workflow.
- Decide whether app sign-out should also terminate the Keycloak SSO session. Current sign-out clears only the local Auth.js session.
- Set production secrets and HTTPS endpoints, and configure an independently controlled immutable audit archive if required.

Auth.js sessions currently use encrypted JWT cookies; PostgreSQL does not store session tokens. Failed password/passkey attempts occur at Keycloak and are not yet forwarded into the app audit table.

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
