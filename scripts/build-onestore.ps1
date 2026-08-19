$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$playConfig = Join-Path $repoRoot "capacitor.config.ts"
$oneStoreConfig = Join-Path $repoRoot "capacitor.onestore.config.ts"
$backupConfig = Join-Path ([System.IO.Path]::GetTempPath()) ("kmate-capacitor-{0}.ts" -f [guid]::NewGuid())
$androidDir = Join-Path $repoRoot "android"
$gradle = Join-Path $androidDir "gradlew.bat"
$outputDir = Join-Path $repoRoot "dist\onestore"

if (-not (Test-Path (Join-Path $androidDir "key.properties"))) {
    throw "android/key.properties is missing. A signed ONE store APK cannot be created."
}

Copy-Item -LiteralPath $playConfig -Destination $backupConfig

try {
    Write-Host "[1/3] Applying the isolated ONE store Capacitor configuration..."
    Copy-Item -LiteralPath $oneStoreConfig -Destination $playConfig -Force
    Push-Location $repoRoot
    try {
        & npx cap copy android
        if ($LASTEXITCODE -ne 0) { throw "Capacitor copy failed." }

        Write-Host "[2/3] Building the signed ONE store beta APK..."
        Push-Location $androidDir
        try {
            & $gradle assembleOnestore
            if ($LASTEXITCODE -ne 0) { throw "Android build failed." }
        }
        finally {
            Pop-Location
        }

        $apk = Get-ChildItem -Path (Join-Path $androidDir "app\build\outputs\apk\onestore") -Filter "*.apk" |
            Where-Object { $_.Name -notmatch "unaligned" } |
            Select-Object -First 1
        if (-not $apk) { throw "The ONE store APK output was not found." }

        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        $target = Join-Path $outputDir "K-MATE-Beta-v1.0.4.apk"
        Copy-Item -LiteralPath $apk.FullName -Destination $target -Force
        Write-Host "[3/3] APK created: $target"
    }
    finally {
        Pop-Location
    }
}
finally {
    Copy-Item -LiteralPath $backupConfig -Destination $playConfig -Force
    Remove-Item -LiteralPath $backupConfig -Force -ErrorAction SilentlyContinue

    Push-Location $repoRoot
    try {
        & npx cap copy android | Out-Host
    }
    finally {
        Pop-Location
    }
    Write-Host "Google Play Capacitor configuration restored."
}

