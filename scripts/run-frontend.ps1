$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $ProjectRoot
$Host.UI.RawUI.WindowTitle = 'Adaptive Traffic - Frontend'
& npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
exit $LASTEXITCODE
