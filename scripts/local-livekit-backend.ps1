param(
    [ValidateSet("start", "stop", "status")]
    [string]$Action = "start"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runtimeDir = Join-Path $repoRoot "tools\runtime"
$statePath = Join-Path $runtimeDir "local-stack-state.json"

$livekitExe = Join-Path $repoRoot "tools\livekit\livekit-server.exe"
$backendDir = Join-Path $repoRoot "ed_vision_backend"

$livekitOutLog = Join-Path $runtimeDir "livekit.out.log"
$livekitErrLog = Join-Path $runtimeDir "livekit.err.log"
$backendOutLog = Join-Path $runtimeDir "backend.out.log"
$backendErrLog = Join-Path $runtimeDir "backend.err.log"

$livekitPort = 7880
$backendPort = 3000

function Write-Info([string]$Message) {
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Ok([string]$Message) {
    Write-Host "[OK]   $Message" -ForegroundColor Green
}

function Write-WarnLine([string]$Message) {
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Ensure-RuntimeDirectory {
    if (-not (Test-Path $runtimeDir)) {
        New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
    }
}

function Read-Int([object]$Value, [int]$DefaultValue) {
    if ($null -eq $Value) {
        return $DefaultValue
    }

    $parsed = 0
    if ([int]::TryParse([string]$Value, [ref]$parsed)) {
        return $parsed
    }

    return $DefaultValue
}

function New-DefaultState {
    return [ordered]@{
        livekit = [ordered]@{
            pid = 0
            startedAt = ""
            outLog = $livekitOutLog
            errLog = $livekitErrLog
        }
        backend = [ordered]@{
            pid = 0
            startedAt = ""
            outLog = $backendOutLog
            errLog = $backendErrLog
        }
    }
}

function Load-State {
    $state = New-DefaultState

    if (-not (Test-Path $statePath)) {
        return $state
    }

    try {
        $raw = Get-Content -Path $statePath -Raw | ConvertFrom-Json

        if ($null -ne $raw.livekit) {
            $state.livekit.pid = Read-Int $raw.livekit.pid 0
            $state.livekit.startedAt = [string]$raw.livekit.startedAt
        }

        if ($null -ne $raw.backend) {
            $state.backend.pid = Read-Int $raw.backend.pid 0
            $state.backend.startedAt = [string]$raw.backend.startedAt
        }
    }
    catch {
        Write-WarnLine "State file is invalid. Creating a fresh state file."
    }

    return $state
}

function Save-State([hashtable]$State) {
    $State | ConvertTo-Json -Depth 8 | Set-Content -Path $statePath -Encoding UTF8
}

function Test-ProcessAlive([int]$ProcessId) {
    if ($ProcessId -le 0) {
        return $false
    }

    return $null -ne (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)
}

function Test-PortOpen([int]$Port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $asyncResult = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        $connected = $asyncResult.AsyncWaitHandle.WaitOne(300)
        if (-not $connected) {
            return $false
        }

        $client.EndConnect($asyncResult) | Out-Null
        return $true
    }
    catch {
        return $false
    }
    finally {
        $client.Close()
    }
}

function Wait-ForPort([int]$Port, [int]$TimeoutSeconds) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-PortOpen $Port) {
            return $true
        }

        Start-Sleep -Milliseconds 400
    }

    return $false
}

function Stop-ProcessTree([int]$ProcessId, [string]$Name) {
    if ($ProcessId -le 0 -or -not (Test-ProcessAlive $ProcessId)) {
        return $false
    }

    try {
        & taskkill /PID $ProcessId /T /F | Out-Null
        Write-Ok "Stopped $Name (PID $ProcessId)."
        return $true
    }
    catch {
        Write-WarnLine "Failed to stop $Name (PID $ProcessId): $($_.Exception.Message)"
        return $false
    }
}

function Stop-LiveKitFallback {
    $candidates = Get-CimInstance Win32_Process -Filter "Name='livekit-server.exe'" -ErrorAction SilentlyContinue
    foreach ($candidate in $candidates) {
        Stop-ProcessTree -ProcessId ([int]$candidate.ProcessId) -Name "LiveKit" | Out-Null
    }
}

function Stop-BackendFallback {
    $shells = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
        Where-Object {
            $commandLine = [string]$_.CommandLine
            $commandLine -like "*ed_vision_backend*" -and $commandLine -like "*start:dev*"
        }

    foreach ($shell in $shells) {
        Stop-ProcessTree -ProcessId ([int]$shell.ProcessId) -Name "Backend shell" | Out-Null
    }
}

function Start-LiveKit([hashtable]$State) {
    if (-not (Test-Path $livekitExe)) {
        throw "LiveKit binary not found: $livekitExe"
    }

    if (Test-ProcessAlive $State.livekit.pid) {
        Write-Info "LiveKit is already running (PID $($State.livekit.pid))."
        return
    }

    if (Test-PortOpen $livekitPort) {
        Write-WarnLine "Port $livekitPort is already in use. Skipping LiveKit start."
        return
    }

    Write-Info "Starting LiveKit server..."
    $startParams = @{
        FilePath = $livekitExe
        ArgumentList = "--dev --bind 0.0.0.0"
        WorkingDirectory = (Split-Path $livekitExe -Parent)
        RedirectStandardOutput = $livekitOutLog
        RedirectStandardError = $livekitErrLog
        PassThru = $true
    }

    $process = Start-Process @startParams

    $State.livekit.pid = $process.Id
    $State.livekit.startedAt = (Get-Date).ToString("s")
    Save-State $State

    if (Wait-ForPort -Port $livekitPort -TimeoutSeconds 20) {
        Write-Ok "LiveKit is running at ws://localhost:$livekitPort (PID $($process.Id))."
        return
    }

    Write-WarnLine "LiveKit process started but port $livekitPort is not reachable yet."
}

function Start-Backend([hashtable]$State) {
    if (-not (Test-Path $backendDir)) {
        throw "Backend directory not found: $backendDir"
    }

    if (Test-ProcessAlive $State.backend.pid) {
        Write-Info "Backend is already running (PID $($State.backend.pid))."
        return
    }

    if (Test-PortOpen $backendPort) {
        Write-WarnLine "Port $backendPort is already in use. Skipping backend start."
        return
    }

    Write-Info "Starting backend (npm run start:dev)..."

    $backendCommand = @(
        "Set-Location '$backendDir'"
        "`$env:LIVEKIT_API_KEY = 'devkey'"
        "`$env:LIVEKIT_API_SECRET = 'secret'"
        "`$env:LIVEKIT_URL = 'ws://localhost:7880'"
        "`$env:LIVEKIT_TOKEN_TTL = '2h'"
        "npm run start:dev"
    ) -join "; "

    $startParams = @{
        FilePath = "powershell.exe"
        ArgumentList = "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $backendCommand
        WorkingDirectory = $backendDir
        RedirectStandardOutput = $backendOutLog
        RedirectStandardError = $backendErrLog
        PassThru = $true
    }

    $process = Start-Process @startParams

    $State.backend.pid = $process.Id
    $State.backend.startedAt = (Get-Date).ToString("s")
    Save-State $State

    if (Wait-ForPort -Port $backendPort -TimeoutSeconds 45) {
        Write-Ok "Backend is running at http://localhost:$backendPort (PID $($process.Id))."
        return
    }

    Write-WarnLine "Backend process started but port $backendPort is not reachable yet."
}

function Stop-LiveKit([hashtable]$State) {
    $stopped = Stop-ProcessTree -ProcessId (Read-Int $State.livekit.pid 0) -Name "LiveKit"
    if (-not $stopped) {
        Stop-LiveKitFallback
    }

    $State.livekit.pid = 0
    $State.livekit.startedAt = ""
}

function Stop-Backend([hashtable]$State) {
    $stopped = Stop-ProcessTree -ProcessId (Read-Int $State.backend.pid 0) -Name "Backend shell"
    if (-not $stopped) {
        Stop-BackendFallback
    }

    $State.backend.pid = 0
    $State.backend.startedAt = ""
}

function Show-Status([hashtable]$State) {
    $livekitPid = Read-Int $State.livekit.pid 0
    $backendPid = Read-Int $State.backend.pid 0

    $livekitAlive = Test-ProcessAlive $livekitPid
    $backendAlive = Test-ProcessAlive $backendPid
    $livekitPortOpen = Test-PortOpen $livekitPort
    $backendPortOpen = Test-PortOpen $backendPort

    $livekitStatus = if ($livekitAlive) {
        "RUNNING (PID $livekitPid)"
    }
    elseif ($livekitPortOpen) {
        "PORT OPEN (external process)"
    }
    else {
        "STOPPED"
    }

    $backendStatus = if ($backendAlive) {
        "RUNNING (PID $backendPid)"
    }
    elseif ($backendPortOpen) {
        "PORT OPEN (external process)"
    }
    else {
        "STOPPED"
    }

    Write-Host ""
    Write-Host "Local Stack Status" -ForegroundColor White
    Write-Host "------------------" -ForegroundColor White
    Write-Host "LiveKit process : $livekitStatus"
    Write-Host "Backend process : $backendStatus"
    Write-Host "LiveKit URL     : ws://localhost:$livekitPort"
    Write-Host "Backend URL     : http://localhost:$backendPort"
    Write-Host "Logs directory  : $runtimeDir"
    Write-Host ""
}

Ensure-RuntimeDirectory
$state = Load-State

switch ($Action) {
    "start" {
        Start-LiveKit -State $state
        Start-Backend -State $state
        Save-State -State $state
        Show-Status -State $state
    }
    "stop" {
        Stop-Backend -State $state
        Stop-LiveKit -State $state
        Save-State -State $state
        Show-Status -State $state
    }
    "status" {
        Show-Status -State $state
    }
}