BEGIN;

CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keycloak_subject text NOT NULL UNIQUE,
  email text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_authenticated_at timestamptz
);

CREATE TABLE IF NOT EXISTS app.user_roles (
  user_id uuid NOT NULL REFERENCES app.app_users(id) ON DELETE CASCADE,
  role_name text NOT NULL CHECK (length(role_name) BETWEEN 1 AND 80),
  granted_by_subject text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_name)
);

CREATE TABLE IF NOT EXISTS app.auth_audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type text NOT NULL CHECK (
    event_type IN (
      'authentication.succeeded',
      'authentication.failed',
      'authorization.granted',
      'authorization.denied',
      'role.granted',
      'role.revoked'
    )
  ),
  actor_subject text,
  target_subject text,
  resource text,
  action text,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  correlation_id text,
  ip_address inet,
  user_agent text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS auth_audit_events_occurred_at_idx
  ON app.auth_audit_events (occurred_at DESC);

CREATE INDEX IF NOT EXISTS auth_audit_events_actor_subject_idx
  ON app.auth_audit_events (actor_subject, occurred_at DESC)
  WHERE actor_subject IS NOT NULL;

CREATE OR REPLACE FUNCTION app.reject_auth_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Authentication audit events are append-only';
END;
$$;

DROP TRIGGER IF EXISTS auth_audit_events_immutable
  ON app.auth_audit_events;

CREATE TRIGGER auth_audit_events_immutable
  BEFORE UPDATE OR DELETE ON app.auth_audit_events
  FOR EACH ROW EXECUTE FUNCTION app.reject_auth_audit_mutation();

REVOKE UPDATE, DELETE, TRUNCATE ON app.auth_audit_events FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aster_app') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA app TO aster_app';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON app.app_users TO aster_app';
    EXECUTE 'GRANT SELECT ON app.user_roles TO aster_app';
    EXECUTE 'GRANT SELECT, INSERT ON app.auth_audit_events TO aster_app';
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE app.auth_audit_events_id_seq TO aster_app';
  ELSE
    RAISE EXCEPTION 'Role aster_app does not exist; run the app-role setup migration first.';
  END IF;
END;
$$;

COMMIT;