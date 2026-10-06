$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$RuntimeDir = Join-Path $ProjectRoot '.runtime'

function Stop-ManagedProcess([string] $Name) {
    $pidFile = Join-Path $RuntimeDir "$Name.pid"
    if (-not (Test-Path $pidFile)) { return }
    $pidText = (Get-Content $pidFile -Raw).Trim()
    $rootPid = 0
    if (-not [int]::TryParse($pidText, [ref]$rootPid) -or $rootPid -le 0) {
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        return
    }
    $expectedScript = "run-$Name.ps1"
    $expectedTitle = if ($Name -eq 'backend') { 'Adaptive Traffic - Backend IA' } else { 'Adaptive Traffic - Frontend' }
    $rootProcess = Get-Process -Id $rootPid -ErrorAction SilentlyContinue
    if ($null -eq $rootProcess) {
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        return
    }

    $managedByTitle = $rootProcess.MainWindowTitle -eq $expectedTitle
    $managedByCommand = $false
    try {
        $rootInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $rootPid" -ErrorAction Stop
        $managedByCommand = -not [string]::IsNullOrWhiteSpace($rootInfo.CommandLine) -and $rootInfo.CommandLine -like "*$expectedScript*"
    } catch {
        # Some Windows environments restrict Win32_Process queries; the title check is sufficient then.
    }
    if (-not ($managedByTitle -or $managedByCommand)) {
        Write-Host "PID $rootPid no parece pertenecer a Adaptive Traffic; no se detuvo." -ForegroundColor Yellow
        return
    }

    $taskKillOutput = @(taskkill.exe /PID $rootPid /T /F 2>&1)
    if ($LASTEXITCODE -ne 0) {
        Write-Host "No se pudo detener el arbol de procesos de ${Name}: $($taskKillOutput -join ' ')" -ForegroundColor Yellow
        return
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    Write-Host "$Name detenido." -ForegroundColor Green
}

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
Stop-ManagedProcess 'frontend'
Stop-ManagedProcess 'backend'
Write-Host 'Adaptive Traffic detenido.'
exit 0
