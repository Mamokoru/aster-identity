param(
  [Parameter(Mandatory = $true)]
  [string]$KeycloakSubject,

  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z][a-z0-9:_-]{0,79}$')]
  [string]$RoleName,

  [Parameter(Mandatory = $true)]
  [string]$GrantedBySubject
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $projectRoot ".env.local"

if (-not (Test-Path $environmentFile)) {
  throw "Missing .env.local. Configure local database credentials before granting a role."
}

$settings = @{}
foreach ($line in Get-Content $environmentFile) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
    $settings[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'")
  }
}

$requiredSettings = @("PGHOST", "PGPORT", "PGDATABASE", "PGMIGRATIONUSER", "PGMIGRATIONPASSWORD")
$missingSettings = @($requiredSettings | Where-Object { -not $settings.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($settings[$_]) })

if ($missingSettings.Count -gt 0) {
  throw "Set these values in .env.local before granting a role: $($missingSettings -join ', ')"
}

$psqlCommand = Get-Command psql -ErrorAction SilentlyContinue
$psqlPath = if ($psqlCommand) {
  $psqlCommand.Source
} else {
  "C:\Program Files\PostgreSQL\18\bin\psql.exe"
}

if (-not (Test-Path $psqlPath)) {
  throw "Could not find psql. Add PostgreSQL 18's bin directory to PATH or install the PostgreSQL client."
}

$arguments = @(
  "-X",
  "-q",
  "-t",
  "-A",
  "-v", "ON_ERROR_STOP=1",
  "-v", "keycloak_subject=$KeycloakSubject",
  "-v", "role_name=$RoleName",
  "-v", "granted_by_subject=$GrantedBySubject",
  "-h", $settings["PGHOST"],
  "-p", $settings["PGPORT"],
  "-U", $settings["PGMIGRATIONUSER"],
  "-d", $settings["PGDATABASE"]
)
$sql = @"
WITH target_user AS (
  SELECT id
  FROM app.app_users
  WHERE keycloak_subject = :'keycloak_subject'
), granted_role AS (
  INSERT INTO app.user_roles (user_id, role_name, granted_by_subject)
  SELECT id, :'role_name', :'granted_by_subject'
  FROM target_user
  ON CONFLICT (user_id, role_name) DO UPDATE
  SET granted_by_subject = EXCLUDED.granted_by_subject,
      granted_at = clock_timestamp()
  RETURNING user_id
)
INSERT INTO app.auth_audit_events
  (event_type, actor_subject, target_subject, resource, action, outcome, details)
SELECT 'role.granted', :'granted_by_subject', :'keycloak_subject', 'app.user_roles', 'grant', 'success',
       jsonb_build_object('role', :'role_name')
FROM granted_role
RETURNING event_type;
"@
$sqlFile = [System.IO.Path]::GetTempFileName()

try {
  $env:PGPASSWORD = $settings["PGMIGRATIONPASSWORD"]
  [System.IO.File]::WriteAllText($sqlFile, $sql, (New-Object System.Text.UTF8Encoding($false)))
  $result = & $psqlPath @arguments -f $sqlFile

  if ($LASTEXITCODE -ne 0) {
    throw "Role grant failed with exit code $LASTEXITCODE."
  }

  if ([string]::IsNullOrWhiteSpace(($result -join "").Trim())) {
    throw "No app user matched the supplied Keycloak subject. The user must sign in once before receiving an app role."
  }

  Write-Output "Granted and audited role '$RoleName' for the matching app user."
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item $sqlFile -ErrorAction SilentlyContinue
}