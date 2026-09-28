BEGIN;

ALTER TABLE app.auth_audit_events
  DROP CONSTRAINT IF EXISTS auth_audit_events_event_type_check;

ALTER TABLE app.auth_audit_events
  ADD CONSTRAINT auth_audit_events_event_type_check
  CHECK (
    event_type IN (
      'authentication.succeeded',
      'authentication.failed',
      'authentication.signed_out',
      'authorization.granted',
      'authorization.denied',
      'role.granted',
      'role.revoked'
    )
  );

COMMIT;