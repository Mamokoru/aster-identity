$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $projectRoot ".env.local"
$roleMigrationFile = Join-Path $projectRoot "db\migrations\000_create_app_role.sql"
$migrationFile = Join-Path $projectRoot "db\migrations\001_initial_schema.sql"

if (-not (Test-Path $environmentFile)) {
  throw "Missing .env.local. Copy .env.example to .env.local and set local database credentials."
}

$settings = @{}
foreach ($line in Get-Content $environmentFile) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
    $settings[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'")
  }
}

$requiredSettings = @(
  "PGHOST",
  "PGPORT",
  "PGDATABASE",
  "PGMIGRATIONUSER",
  "PGMIGRATIONPASSWORD",
  "PGPASSWORD"
)
$missingSettings = @($requiredSettings | Where-Object { -not $settings.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($settings[$_]) })

if ($missingSettings.Count -gt 0) {
  throw "Set these values in .env.local before migrating: $($missingSettings -join ', ')"
}

if ($settings["PGMIGRATIONPASSWORD"] -like "replace-with-*") {
  throw "Set PGMIGRATIONPASSWORD in .env.local to the local database-owner password before migrating."
}

if ($settings["PGPASSWORD"] -like "replace-with-*") {
  throw "Set PGPASSWORD in .env.local to the dedicated aster_app role password before migrating."
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
  "-v", "ON_ERROR_STOP=1",
  "-h", $settings["PGHOST"],
  "-p", $settings["PGPORT"],
  "-U", $settings["PGMIGRATIONUSER"],
  "-d", $settings["PGDATABASE"]
)

try {
  $env:PGPASSWORD = $settings["PGMIGRATIONPASSWORD"]
  $env:PGAPP_PASSWORD = $settings["PGPASSWORD"]

  & $psqlPath @arguments -f $roleMigrationFile

  if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL app-role setup failed with exit code $LASTEXITCODE."
  }

  & $psqlPath @arguments -f $migrationFile

  if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL schema migration failed with exit code $LASTEXITCODE."
  }
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:PGAPP_PASSWORD -ErrorAction SilentlyContinue
}