Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$entryScript = Join-Path $PSScriptRoot "local-livekit-backend.ps1"
& $entryScript -Action stop