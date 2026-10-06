$ErrorActionPreference = 'Stop'

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$BackendDir = Join-Path $ProjectRoot 'backend'
$VenvDir = Join-Path $BackendDir '.venv'
$VenvPython = Join-Path $BackendDir '.venv\Scripts\python.exe'
$RuntimeDir = Join-Path $ProjectRoot '.runtime'
$LockFile = Join-Path $ProjectRoot 'package-lock.json'
$LockMarker = Join-Path $RuntimeDir 'package-lock.sha256'

function Write-Section([string] $Message) {
    Write-Host ''
    Write-Host ('=' * 56) -ForegroundColor DarkCyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host ('=' * 56) -ForegroundColor DarkCyan
}

function Test-Command([string] $Name) {
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Refresh-ProcessPath {
    $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if ($machinePath -or $userPath) { $env:Path = "$machinePath;$userPath" }
}

function Get-PythonCandidate {
    if (Test-Command 'py') {
        $savedErrorActionPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        $launcherOutput = (& py -3.11 --version 2>&1 | Out-String).Trim()
        $launcherExitCode = $LASTEXITCODE
        $ErrorActionPreference = $savedErrorActionPreference
        if ($launcherExitCode -eq 0 -and $launcherOutput -match 'Python\s+(\d+)\.(\d+)') {
            return [pscustomobject]@{ File = 'py'; Args = @('-3.11'); Version = $Matches[0] }
        }
    }

    foreach ($commandName in @('python', 'python3')) {
        if (-not (Test-Command $commandName)) { continue }
        $savedErrorActionPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        $versionOutput = (& $commandName --version 2>&1 | Out-String).Trim()
        $commandExitCode = $LASTEXITCODE
        $ErrorActionPreference = $savedErrorActionPreference
        if ($commandExitCode -ne 0 -or $versionOutput -notmatch 'Python\s+(\d+)\.(\d+)') { continue }
        $major = [int]$Matches[1]
        $minor = [int]$Matches[2]
        if ($major -eq 3 -and $minor -ge 10 -and $minor -le 13) {
            return [pscustomobject]@{ File = $commandName; Args = @(); Version = "Python $major.$minor" }
        }
    }

    $launcherPaths = @()
    if (Test-Command 'py') {
        $savedErrorActionPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        $launcherList = (& py -0p 2>&1 | Out-String)
        $ErrorActionPreference = $savedErrorActionPreference
        $launcherPaths = [regex]::Matches($launcherList, '(?im)([A-Z]:\\[^\r\n]*?python\.exe)') | ForEach-Object { $_.Groups[1].Value.Trim() }
    }

    $commonPythonPaths = @(
        "$env:LocalAppData\Programs\Python\Python3*\python.exe",
        "$env:ProgramFiles\Python3*\python.exe",
        "${env:ProgramFiles(x86)}\Python3*\python.exe",
        'C:\Python3*\python.exe'
    )
    $directPaths = @($launcherPaths) + @($commonPythonPaths | ForEach-Object { Get-ChildItem -Path $_ -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName })
    foreach ($candidatePath in ($directPaths | Select-Object -Unique)) {
        if (Test-Path $candidatePath) {
            $savedErrorActionPreference = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            $versionOutput = (& $candidatePath --version 2>&1 | Out-String).Trim()
            $commandExitCode = $LASTEXITCODE
            $ErrorActionPreference = $savedErrorActionPreference
            if ($commandExitCode -eq 0 -and $versionOutput -match 'Python\s+(\d+)\.(\d+)') {
                $major = [int]$Matches[1]
                $minor = [int]$Matches[2]
                if ($major -eq 3 -and $minor -ge 10 -and $minor -le 14) {
                    return [pscustomobject]@{ File = $candidatePath; Args = @(); Version = "Python $major.$minor" }
                }
            }
        }
    }
    return $null
}

function Install-Python {
    if (-not (Test-Command 'winget')) {
        Write-Host 'No se encontro Python compatible y winget no esta disponible.' -ForegroundColor Red
        Write-Host 'Se abrira la pagina oficial de descargas de Python.' -ForegroundColor Yellow
        Start-Process 'https://www.python.org/downloads/windows/'
        throw 'Python 3.10-3.14 es necesario. Instala Python y vuelve a ejecutar INSTALAR.bat.'
    }
    Write-Host 'Python compatible no encontrado. Instalando Python 3.11 con winget...' -ForegroundColor Yellow
    $savedErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & winget install --id Python.Python.3.11 --exact --source winget --accept-source-agreements --accept-package-agreements
    $wingetExitCode = $LASTEXITCODE
    $ErrorActionPreference = $savedErrorActionPreference
    if ($wingetExitCode -ne 0) {
        Start-Process 'https://www.python.org/downloads/windows/'
        throw 'winget no pudo instalar Python 3.11.'
    }
}

function Get-NodeStatus {
    $node = Test-Command 'node'
    $npm = Test-Command 'npm'
    if (-not ($node -and $npm)) { return $null }
    $nodeVersion = (& node --version 2>&1 | Out-String).Trim()
    $npmVersion = (& npm --version 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(\d+)\.(\d+)\.(\d+)') { return $null }
    $nodeMajor = [int]$Matches[1]
    $nodeMinor = [int]$Matches[2]
    if ($npmVersion -notmatch '^\d+') { return $null }
    $viteCompatible = ($nodeMajor -eq 20 -and $nodeMinor -ge 19) -or ($nodeMajor -ge 22 -and ($nodeMajor -gt 22 -or $nodeMinor -ge 12))
    if (-not $viteCompatible) { return $null }
    return [pscustomobject]@{ Node = $nodeVersion; Npm = $npmVersion }
}

function Install-Node {
    if (-not (Test-Command 'winget')) {
        Write-Host 'No se encontro Node.js y winget no esta disponible.' -ForegroundColor Red
        Write-Host 'Se abrira la pagina oficial de descargas de Node.js.' -ForegroundColor Yellow
        Start-Process 'https://nodejs.org/en/download'
        throw 'Node.js LTS es necesario. Instala Node.js y vuelve a ejecutar INSTALAR.bat.'
    }
    Write-Host 'Node.js no encontrado. Instalando Node.js LTS con winget...' -ForegroundColor Yellow
    $savedErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & winget install --id OpenJS.NodeJS.LTS --exact --source winget --accept-source-agreements --accept-package-agreements
    $wingetExitCode = $LASTEXITCODE
    $ErrorActionPreference = $savedErrorActionPreference
    if ($wingetExitCode -ne 0) {
        Start-Process 'https://nodejs.org/en/download'
        throw 'winget no pudo instalar Node.js LTS.'
    }
}

function Invoke-Python([string[]] $Arguments) {
    & $script:Python.File @($script:Python.Args + $Arguments)
    if ($LASTEXITCODE -ne 0) { throw "Fallo Python: $($Arguments -join ' ')" }
}

function Test-VenvCompatible([string] $PythonPath) {
    if (-not (Test-Path $PythonPath)) { return $false }
    $savedErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $versionOutput = (& $PythonPath --version 2>&1 | Out-String).Trim()
    $commandExitCode = $LASTEXITCODE
    $ErrorActionPreference = $savedErrorActionPreference
    if ($commandExitCode -ne 0) { return $false }
    if ($versionOutput -notmatch 'Python\s+(\d+)\.(\d+)') { return $false }
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    return $major -eq 3 -and $minor -ge 10 -and $minor -le 14
}

function Get-VenvProcesses {
    if (-not (Test-Path $VenvDir)) { return @() }
    $venvPrefix = ((Resolve-Path $VenvDir).Path).TrimEnd('\') + '\'
    $matches = @()
    foreach ($process in @(Get-Process -ErrorAction SilentlyContinue)) {
        try { $processPath = $process.Path } catch { $processPath = $null }
        if ($processPath -and $processPath.StartsWith($venvPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            $matches += $process
        }
    }
    return $matches
}

function Invoke-Npm([ValidateSet('ci', 'install')][string] $Mode) {
    $savedErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    Push-Location $ProjectRoot
    try {
        if ($Mode -eq 'ci') { & npm ci 2>&1 | ForEach-Object { Write-Host $_ } }
        else { & npm install 2>&1 | ForEach-Object { Write-Host $_ } }
        return [int]$LASTEXITCODE
    } finally {
        Pop-Location
        $ErrorActionPreference = $savedErrorActionPreference
    }
}

try {
    New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

    Write-Section 'ADAPTIVE TRAFFIC - INSTALACION'

    Write-Host 'Comprobando Python...' -ForegroundColor White
    $script:Python = Get-PythonCandidate
    if ($null -eq $script:Python) {
        Install-Python
        Refresh-ProcessPath
        $script:Python = Get-PythonCandidate
    }
    if ($null -eq $script:Python) { throw 'Python sigue sin estar disponible despues de la instalacion.' }
    Write-Host "  OK: $($script:Python.Version) [$($script:Python.File)]" -ForegroundColor Green

    Write-Host 'Comprobando Node.js y npm...' -ForegroundColor White
    $nodeStatus = Get-NodeStatus
    if ($null -eq $nodeStatus) {
        Install-Node
        Refresh-ProcessPath
        $nodeStatus = Get-NodeStatus
    }
    if ($null -eq $nodeStatus) { throw 'Node.js/npm siguen sin estar disponibles despues de la instalacion.' }
    Write-Host "  OK: Node $($nodeStatus.Node), npm $($nodeStatus.Npm)" -ForegroundColor Green

    Write-Section 'ENTORNO PYTHON'
    if ((Test-Path $VenvDir) -and -not (Test-VenvCompatible $VenvPython)) {
        Write-Host 'backend\.venv existe, pero usa una version de Python no compatible; se recreara con la version detectada.' -ForegroundColor Yellow
        $venvProcesses = @(Get-VenvProcesses)
        if ($venvProcesses.Count -gt 0) {
            $processIds = ($venvProcesses | Select-Object -ExpandProperty Id) -join ', '
            throw "No se puede recrear backend\.venv porque esta siendo usado por el proceso $processIds. Cierra esa ventana de Python/backend y vuelve a ejecutar INSTALAR.bat."
        }
        try {
            Remove-Item -LiteralPath $VenvDir -Recurse -Force
        } catch {
            throw "No se pudo reemplazar backend\.venv porque algun archivo esta bloqueado (por ejemplo cv2.pyd). Cierra VS Code, FastAPI y cualquier proceso Python que use esta carpeta y vuelve a ejecutar INSTALAR.bat. Detalle: $($_.Exception.Message)"
        }
    }
    if (-not (Test-Path $VenvPython)) {
        Write-Host 'Creando backend\.venv...' -ForegroundColor White
        Invoke-Python @('-m', 'venv', $VenvDir)
    }
    if (-not (Test-Path $VenvPython)) { throw "No se pudo crear $VenvPython" }
    Write-Host 'Actualizando pip...' -ForegroundColor White
    & $VenvPython -m pip install --upgrade pip
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo actualizar pip.' }
    Write-Host 'Instalando dependencias de backend...' -ForegroundColor White
    & $VenvPython -m pip install -r (Join-Path $BackendDir 'requirements.txt')
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar backend\requirements.txt.' }

    Write-Section 'FRONTEND'
    $nodeModulesDir = Join-Path $ProjectRoot 'node_modules'
    $nodeModulesExists = Test-Path $nodeModulesDir
    $needsNpmInstall = -not $nodeModulesExists
    if (Test-Path $LockFile) {
        $currentHash = (Get-FileHash -Algorithm SHA256 $LockFile).Hash
        if (-not (Test-Path $LockMarker) -or ((Get-Content $LockMarker -Raw).Trim() -ne $currentHash)) { $needsNpmInstall = $true }
        if ($needsNpmInstall) {
            if ($nodeModulesExists) {
                Write-Host 'node_modules ya existe; sincronizando con npm install para no reemplazar binarios nativos bloqueados...' -ForegroundColor White
                $npmExitCode = Invoke-Npm 'install'
                if ($npmExitCode -ne 0) {
                    Write-Host 'npm install no pudo modificar node_modules (posible bloqueo EPERM). Se validara la instalacion existente con npm run build.' -ForegroundColor Yellow
                }
            } else {
                Write-Host 'Instalando dependencias frontend con npm ci...' -ForegroundColor White
                $npmExitCode = Invoke-Npm 'ci'
                if ($npmExitCode -ne 0) {
                    Write-Host 'npm ci fallo; usando npm install como recuperacion...' -ForegroundColor Yellow
                    $npmExitCode = Invoke-Npm 'install'
                }
                if ($npmExitCode -ne 0) { throw 'npm ci/npm install fallaron.' }
            }
        } else {
            Write-Host 'node_modules ya esta actualizado.' -ForegroundColor Green
        }
    } else {
        Write-Host 'No existe package-lock.json; usando npm install...' -ForegroundColor Yellow
        if ((Invoke-Npm 'install') -ne 0) { throw 'npm install fallo.' }
    }

    Write-Section 'CONFIGURACION Y MODELO'
    $envFile = Join-Path $ProjectRoot '.env'
    $envExample = Join-Path $ProjectRoot '.env.example'
    if (-not (Test-Path $envFile) -and (Test-Path $envExample)) {
        Copy-Item $envExample $envFile
        Write-Host '.env creado desde .env.example.' -ForegroundColor Green
    } elseif (Test-Path $envFile) {
        Write-Host '.env existente conservado sin cambios.' -ForegroundColor Green
    }

    $modelsDir = Join-Path $BackendDir 'models'
    $modelTarget = Join-Path $modelsDir 'yolo11n.pt'
    New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null
    if (-not (Test-Path $modelTarget)) {
        $modelCandidates = Get-ChildItem -Path $ProjectRoot -Recurse -File -Filter 'yolo11n.pt' -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -ne $modelTarget -and $_.FullName -notlike '*\node_modules\*' }
        if ($modelCandidates) {
            Copy-Item $modelCandidates[0].FullName $modelTarget
            Write-Host "Modelo local copiado a backend\models\yolo11n.pt desde $($modelCandidates[0].FullName)." -ForegroundColor Green
        }
    }
    if (Test-Path $modelTarget) {
        Write-Host 'Modelo YOLO local encontrado: backend\models\yolo11n.pt' -ForegroundColor Green
    } else {
        Write-Host 'ADVERTENCIA:' -ForegroundColor Yellow
        Write-Host 'No se encontro el modelo YOLO local.' -ForegroundColor Yellow
        Write-Host 'Se necesitara Internet para descargarlo la primera vez.' -ForegroundColor Yellow
    }

    Write-Section 'VALIDACION'
    Write-Host 'Validando imports del backend...' -ForegroundColor White
    & $VenvPython -c "import fastapi, cv2, ultralytics, torch; print('fastapi, cv2, ultralytics y torch: OK')"
    if ($LASTEXITCODE -ne 0) { throw 'Fallo la validacion de imports: fastapi, cv2, ultralytics o torch.' }
    Write-Host 'Ejecutando npm run build...' -ForegroundColor White
    Push-Location $ProjectRoot
    try { & npm run build } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { throw 'Fallo npm run build.' }
    if (Test-Path $LockFile) {
        $currentHash = (Get-FileHash -Algorithm SHA256 $LockFile).Hash
        Set-Content -Path $LockMarker -Value $currentHash -NoNewline
    }

    Write-Host ''
    Write-Host '=========================================' -ForegroundColor Green
    Write-Host '        ADAPTIVE TRAFFIC' -ForegroundColor Green
    Write-Host '=========================================' -ForegroundColor Green
    Write-Host ''
    Write-Host 'INSTALACION COMPLETADA' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Para ejecutar el sistema:'
    Write-Host 'Doble clic en INICIAR.bat'
    Write-Host ''
    Write-Host 'Backend:  http://127.0.0.1:8001'
    Write-Host 'Frontend: http://localhost:5173'
    Write-Host ''
    Write-Host '=========================================' -ForegroundColor Green
    exit 0
} catch {
    Write-Host ''
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
