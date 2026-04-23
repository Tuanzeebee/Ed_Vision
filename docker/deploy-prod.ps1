param(
    [string]$EnvFile = ".env.docker",
    [switch]$Build
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
    throw "Env file '$EnvFile' was not found. Copy '.env.docker.example' to '$EnvFile' first."
}

$values = @{}
Get-Content $EnvFile | ForEach-Object {
    if ([string]::IsNullOrWhiteSpace($_) -or $_.TrimStart().StartsWith("#")) {
        return
    }

    $parts = $_ -split "=", 2
    if ($parts.Count -eq 2) {
        $key = $parts[0].Trim()
        $value = $parts[1].Trim().Trim('"').Trim("'")
        $values[$key] = $value
    }
}

$backendReplicas = if ($values.ContainsKey("BACKEND_REPLICAS")) { $values["BACKEND_REPLICAS"] } else { "1" }
$mlReplicas = if ($values.ContainsKey("ML_REPLICAS")) { $values["ML_REPLICAS"] } else { "1" }

$args = @(
    "--env-file", $EnvFile,
    "-f", "docker-compose.prod.yml",
    "up", "-d", "--remove-orphans",
    "--scale", "backend=$backendReplicas",
    "--scale", "ml-service=$mlReplicas"
)

if ($Build) {
    $args += "--build"
}

docker compose @args
