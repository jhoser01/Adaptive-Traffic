param([Parameter(Mandatory = $true)][string] $PythonPath)
$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $ProjectRoot
$Host.UI.RawUI.WindowTitle = 'Adaptive Traffic - Backend IA'
& $PythonPath -m uvicorn backend.app:app --host 127.0.0.1 --port 8001
exit $LASTEXITCODE
