\getenv app_password PGAPP_PASSWORD

SELECT format('CREATE ROLE aster_app LOGIN PASSWORD %L', :'app_password')
WHERE NOT EXISTS (
  SELECT 1 FROM pg_roles WHERE rolname = 'aster_app'
)
\gexec