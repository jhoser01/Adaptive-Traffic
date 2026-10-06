$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$RuntimeDir = Join-Path $ProjectRoot '.runtime'
$PythonPath = Join-Path $ProjectRoot 'backend\.venv\Scripts\python.exe'
$BackendPidFile = Join-Path $RuntimeDir 'backend.pid'
$FrontendPidFile = Join-Path $RuntimeDir 'frontend.pid'
$BackendScript = Join-Path $ProjectRoot 'scripts\run-backend.ps1'
$FrontendScript = Join-Path $ProjectRoot 'scripts\run-frontend.ps1'
$BackendErrorLog = Join-Path $RuntimeDir 'backend.error.log'
$FrontendErrorLog = Join-Path $RuntimeDir 'frontend.error.log'

function Quote-ProcessArgument([string] $Value) {
    return '"' + $Value.Replace('"', '\"') + '"'
}

function Test-HttpReady([string] $Url) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
    } catch { return $false }
}

function Test-FrontendReady {
    try {
        $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 3
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 300 -and $response.Content -match 'Adaptive Traffic'
    } catch { return $false }
}

function Test-PortInUse([int] $Port) {
    try { return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop) }
    catch {
        $pattern = "\s+\S+:$Port\s+\S+\s+(LISTENING|ESCUCHANDO)\s+\d+\s*$"
        $netstatLines = @(netstat -ano -p tcp 2>$null | Select-String -Pattern $pattern)
        return $netstatLines.Count -gt 0
    }
}

function Get-PidFromFile([string] $Path) {
    if (-not (Test-Path $Path)) { return $null }
    $value = (Get-Content $Path -Raw).Trim()
    $pidValue = 0
    if ([int]::TryParse($value, [ref]$pidValue) -and $pidValue -gt 0) { return $pidValue }
    return $null
}

function Test-ProcessAlive([int] $ProcessId) {
    if ($ProcessId -le 0) { return $false }
    return $null -ne (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)
}

function Wait-Http {
    param(
        [string] $Label,
        [string] $Url,
        [int] $TimeoutSeconds = 60,
        [int] $ProcessId = 0,
        [string] $ErrorLog = ''
    )
    for ($second = 1; $second -le $TimeoutSeconds; $second++) {
        if (Test-HttpReady $Url) { Write-Host "$Label listo." -ForegroundColor Green; return }
        if ($ProcessId -gt 0 -and -not (Test-ProcessAlive $ProcessId)) {
            $details = ''
            if ($ErrorLog -and (Test-Path $ErrorLog)) {
                $details = ((Get-Content $ErrorLog -Tail 20 -ErrorAction SilentlyContinue) -join [Environment]::NewLine).Trim()
            }
            if ([string]::IsNullOrWhiteSpace($details)) { $details = 'La ventana secundaria se cerro sin mostrar detalles.' }
            throw "$Label se cerro antes de responder. Detalle: $details"
        }
        Start-Sleep -Seconds 1
    }
    throw "$Label no respondio en $TimeoutSeconds segundos: $Url"
}

try {
    New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
    if (-not (Test-Path $PythonPath) -or -not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
        Write-Host 'Primero ejecuta INSTALAR.bat' -ForegroundColor Yellow
        exit 1
    }

    Write-Host 'Iniciando backend...' -ForegroundColor Cyan
    $backendPid = Get-PidFromFile $BackendPidFile
    $backendReady = Test-HttpReady 'http://127.0.0.1:8001/health'
    if ($backendReady) {
        Write-Host 'Backend ya activo.' -ForegroundColor Green
    } elseif (Test-ProcessAlive $backendPid) {
        throw "El proceso backend guardado en $BackendPidFile sigue activo, pero /health no responde. Revisa la ventana 'Adaptive Traffic - Backend IA'."
    } elseif (Test-PortInUse 8001) {
        throw 'El puerto 8001 esta ocupado, pero /health no responde. Cierra el proceso que usa ese puerto y vuelve a ejecutar INICIAR.bat.'
    } else {
        $backendProcess = Start-Process -FilePath 'powershell.exe' -WorkingDirectory $ProjectRoot -PassThru -WindowStyle Normal -RedirectStandardError $BackendErrorLog -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Quote-ProcessArgument $BackendScript), '-PythonPath', (Quote-ProcessArgument $PythonPath))
        Set-Content -Path $BackendPidFile -Value $backendProcess.Id -NoNewline
        Wait-Http -Label 'Backend' -Url 'http://127.0.0.1:8001/health' -ProcessId $backendProcess.Id -ErrorLog $BackendErrorLog
    }

    Write-Host 'Iniciando frontend...' -ForegroundColor Cyan
    $frontendPid = Get-PidFromFile $FrontendPidFile
    $frontendReady = Test-FrontendReady
    if ((Test-ProcessAlive $frontendPid) -and $frontendReady) {
        Write-Host 'Frontend ya activo.' -ForegroundColor Green
    } elseif ($frontendReady -and (Test-PortInUse 5173)) {
        Write-Host 'Frontend ya activo en 5173; se reutiliza la instancia existente.' -ForegroundColor Green
    } elseif (Test-ProcessAlive $frontendPid) {
        throw "El proceso frontend guardado en $FrontendPidFile sigue activo, pero Vite no responde. Revisa la ventana 'Adaptive Traffic - Frontend'."
    } elseif (Test-PortInUse 5173) {
        throw 'El puerto 5173 esta ocupado. Vite usa strictPort y no cambiara silenciosamente a otro puerto. Cierra el proceso que usa ese puerto y vuelve a ejecutar INICIAR.bat.'
    } else {
        $frontendProcess = Start-Process -FilePath 'powershell.exe' -WorkingDirectory $ProjectRoot -PassThru -WindowStyle Normal -RedirectStandardError $FrontendErrorLog -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Quote-ProcessArgument $FrontendScript))
        Set-Content -Path $FrontendPidFile -Value $frontendProcess.Id -NoNewline
        Wait-Http -Label 'Frontend' -Url 'http://127.0.0.1:5173' -ProcessId $frontendProcess.Id -ErrorLog $FrontendErrorLog
    }

    Write-Host 'Servicios disponibles. Abriendo el navegador...' -ForegroundColor Green
    Start-Process 'http://localhost:5173'
    exit 0
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
