# logifai installer for Windows — downloads the latest binary from GitHub Releases
# Usage: irm https://raw.githubusercontent.com/tomoyaf/logifai/main/install.ps1 | iex

$ErrorActionPreference = "Stop"

$Repo = "tomoyaf/logifai"
$InstallDir = if ($env:LOGIFAI_INSTALL) { $env:LOGIFAI_INSTALL } else { Join-Path $env:USERPROFILE ".logifai\bin" }

function Write-Info($msg) {
    Write-Host "  > " -ForegroundColor Blue -NoNewline
    Write-Host $msg
}

function Write-Err($msg) {
    Write-Host "  error: $msg" -ForegroundColor Red
    exit 1
}

# --- Determine version ---

if ($env:LOGIFAI_VERSION) {
    $Version = $env:LOGIFAI_VERSION
} else {
    Write-Info "Fetching latest version..."
    try {
        $Release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -Headers @{ "User-Agent" = "logifai-installer" }
        $Version = $Release.tag_name -replace "^v", ""
    } catch {
        Write-Err "Could not determine latest version: $_"
    }
}

if (-not $Version) {
    Write-Err "Could not determine latest version"
}

$BinaryName = "logifai-windows-x64.exe"
$DownloadUrl = "https://github.com/$Repo/releases/download/v$Version/$BinaryName"
$ChecksumUrl = "https://github.com/$Repo/releases/download/v$Version/checksums.txt"

Write-Info "Installing logifai v$Version for windows-x64..."

# --- Create install directory ---

if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

# --- Download binary ---

$TmpFile = Join-Path $env:TEMP "logifai-download-$([guid]::NewGuid().ToString('N').Substring(0,8)).exe"

try {
    Write-Info "Downloading $BinaryName..."
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $TmpFile -UseBasicParsing
} catch {
    if (Test-Path $TmpFile) { Remove-Item $TmpFile -Force }
    Write-Err "Download failed: $_"
}

# --- Verify checksum ---

try {
    $Checksums = (Invoke-WebRequest -Uri $ChecksumUrl -UseBasicParsing).Content
    $ExpectedLine = ($Checksums -split "`n") | Where-Object { $_ -match $BinaryName } | Select-Object -First 1
    if ($ExpectedLine) {
        $Expected = ($ExpectedLine -split "\s+")[0]
        $Actual = (Get-FileHash -Path $TmpFile -Algorithm SHA256).Hash.ToLower()
        if ($Actual -ne $Expected) {
            Remove-Item $TmpFile -Force
            Write-Err "Checksum verification failed (expected: $Expected, got: $Actual)"
        }
        Write-Info "Checksum verified."
    }
} catch {
    Write-Info "Checksum verification skipped (could not fetch checksums.txt)"
}

# --- Install ---

$DestPath = Join-Path $InstallDir "logifai.exe"
Move-Item -Path $TmpFile -Destination $DestPath -Force
Write-Info "Installed to $DestPath"

# --- Add to PATH ---

$CurrentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($CurrentPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$InstallDir;$CurrentPath", "User")
    Write-Info "Added $InstallDir to user PATH"
    Write-Info "Restart your terminal for PATH changes to take effect."
} else {
    Write-Info "$InstallDir is already in PATH"
}

Write-Info "Done! Run 'logifai --version' to verify."
