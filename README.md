# Aster Authentication Starter

Next.js App Router authentication starter using Keycloak OIDC and PostgreSQL for application identity mappings, authorization roles, and audit events. Keycloak remains responsible for passwords, passkeys, MFA, and identity-provider sessions.

## Goal

Provide a reusable, security-focused authentication starter that is straightforward to configure locally and has clear production-hardening guidance. OIDC delegates identity verification to an identity provider; PostgreSQL stores only application identity mappings, roles, and app-side audit events. The app must not collect or store users' passwords.

This is a technical security baseline, not a claim of legal compliance or certification. Applicable legal obligations depend on deployment location, organization, and the data being processed.

## Initial Compliance Targets

These are the security/compliance controls this project is initially designed to pursue. Status describes the current implementation, not a certification.

- **Identity verification:** OAuth 2.0 / OIDC through Keycloak is wired. MFA and passwordless passkeys using WebAuthn must be enabled and verified in the realm.
- **Data in transit:** HTTPS/TLS is required for production app and identity-provider endpoints. Local development uses HTTP; production deployment is not configured yet.
- **Least privilege:** OIDC is used for sign-in, and PostgreSQL has a restricted runtime role. `/workspace` checks the `workspace:access` app role on the server and denies access by default.
- **Account defense:** Keycloak brute-force detection and temporary lockout need to be configured and verified. CAPTCHA is not currently implemented.
- **Audit trails:** Successful app sign-ins, local and Keycloak sign-outs, role grants, and authorization decisions are recorded in PostgreSQL. Failed login events still need to be forwarded from Keycloak. The database trigger prevents mutation through the app role, but administrator-proof immutability requires an external WORM archive.

## Current Progress

Implemented:

- Auth.js v4 Keycloak provider and App Router callback route, using the `aster` realm configuration from environment variables.
- Password/passkey handling delegated to Keycloak; the app sign-in action redirects to the provider.
- PostgreSQL pool with TLS verification by default in production, Keycloak subject-to-app-user mapping, and successful sign-in/local sign-out audit writes.
- Protected `/workspace` route with server-side role checking, default-deny behavior, and authorization audit records.
- `scripts/grant-app-role.ps1` for explicit operator-driven role assignment with a corresponding audit event.
- RP-initiated Keycloak logout using the ID-token hint, followed by local Auth.js session clearing.
- PostgreSQL schema, append-only-for-the-app audit trigger, migration runner, and least-privilege runtime grants.
- Lint and production build pass. Local checks verified OIDC redirect construction, anonymous workspace denial/audit, and database audit write permissions.

Still to do or verify:

- Complete a real Keycloak user sign-in/callback and RP-initiated logout test. No test account has been created because Keycloak admin access is unavailable.
- Configure and verify realm MFA/passkeys, brute-force protection, and Keycloak failed-login event capture. These require working Keycloak administrator access.
- Configure production HTTPS and PostgreSQL TLS, deploy secrets through an appropriate secret manager, and configure an independently controlled immutable audit archive if required.

Auth.js sessions currently use encrypted JWT cookies; PostgreSQL does not store session tokens. Failed password/passkey attempts occur at Keycloak and are not yet forwarded into the app audit table.

## Local Setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and set local database and Keycloak values. `.env.local` is ignored by Git; never commit it or share its contents.
3. Use a separate PostgreSQL database for this app, such as `aster_auth`. Do not point this app at Keycloak's internal database.
4. Set `PGUSER` and `PGPASSWORD` to a restricted application role. Set `PGMIGRATIONUSER` and `PGMIGRATIONPASSWORD` to a separate role allowed to create the app role and schema.
5. Apply the schema with `./scripts/apply-db-migration.ps1` from PowerShell.
6. Start the app with `pnpm dev` and open [http://localhost:3000](http://localhost:3000).

In the Keycloak client, allow the local callback `http://localhost:3000/api/auth/callback/keycloak` and post-logout redirect `http://localhost:3000/auth/complete-logout`. The sign-out link first redirects to Keycloak's end-session endpoint, then clears the local Auth.js cookie when Keycloak returns.

After a user signs in once and is mapped into `app.app_users`, an authorized operator with access to the migration credentials can grant workspace access from PowerShell. Protect those credentials as administrator-only secrets; the script records the supplied grantor subject in the audit event.

```powershell
./scripts/grant-app-role.ps1 -KeycloakSubject "<user-sub>" -RoleName "workspace:access" -GrantedBySubject "<operator-sub>"
```

The runtime role needs access to the `app` schema tables granted by the migration. Successful Keycloak sign-ins upsert `app.app_users` and append audit events. Server-side role checks use `app.user_roles` and write allow/deny events to `app.auth_audit_events`.

Auth.js v4 sessions remain encrypted JWT cookies; PostgreSQL does not store session tokens. Signing out of the app does not end the separate Keycloak SSO session. Failed password/passkey attempts must be captured from Keycloak's event system; they do not pass through the app's sign-in event callback.

## Production Notes

- Use HTTPS for the app and Keycloak, configure exact production redirect URIs, and set a strong `NEXTAUTH_SECRET`.
- Set `PGSSLMODE=verify-full` for PostgreSQL connections in production. The `disable` value in `.env.example` is for local development only.
- Keep database roles least-privileged, rotate credentials, and protect backups. The audit trigger blocks edits through the app role; database administrators can still alter records. Export audit records to an independently controlled immutable archive when required.
- Legal obligations depend on deployment jurisdiction, data, and organization. This starter provides technical controls, not a certification or legal determination.
