$ErrorActionPreference = "Stop"

# Stop any running instance before compiling to avoid file lock
Stop-Process -Name "win-media-bridge" -Force -ErrorAction SilentlyContinue

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceFile = Join-Path $scriptDir "win-media-bridge.cs"
$outFile = Join-Path $scriptDir "win-media-bridge.exe"

Write-Host "Building Windows Media Bridge..." -ForegroundColor Cyan

$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) {
    $csc = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
}

if (-not (Test-Path $csc)) {
    Write-Error "Could not find csc.exe compiler in .NET Framework directory."
    exit 1
}

# Find Windows.winmd
$winmdCandidates = @(
    "C:\Program Files (x86)\Windows Kits\10\UnionMetadata\10.0.22621.0\Windows.winmd",
    "C:\Program Files (x86)\Windows Kits\10\UnionMetadata\10.0.19041.0\Windows.winmd",
    "C:\Program Files (x86)\Windows Kits\10\UnionMetadata\10.0.22000.0\Windows.winmd",
    "C:\Program Files\Windows Kits\10\UnionMetadata\10.0.22621.0\Windows.winmd"
)

$winmd = $null
foreach ($c in $winmdCandidates) {
    if (Test-Path $c) {
        $winmd = $c
        break
    }
}

if (-not $winmd) {
    $found = Get-ChildItem -Path "C:\Program Files (x86)\Windows Kits\10\UnionMetadata" -Filter "Windows.winmd" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $winmd = $found.FullName
    }
}

if (-not $winmd) {
    Write-Error "Could not locate Windows.winmd."
    exit 1
}

Write-Host "Using Windows metadata: $winmd"

$frameworkDir = Split-Path -Parent $csc
$runtimeDll = Join-Path $frameworkDir "System.Runtime.dll"
$tasksDll = Join-Path $frameworkDir "System.Threading.Tasks.dll"
$winRuntimeDll = Join-Path $frameworkDir "System.Runtime.WindowsRuntime.dll"
$windowsBaseDll = Join-Path $frameworkDir "WPF\WindowsBase.dll"
if (-not (Test-Path $windowsBaseDll)) {
    $windowsBaseDll = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\WPF\WindowsBase.dll"
}

& $csc /nologo /optimize /target:exe `
    /r:"$runtimeDll" `
    /r:"$tasksDll" `
    /r:"$winRuntimeDll" `
    /r:"$windowsBaseDll" `
    /r:"$winmd" `
    /out:"$outFile" `
    "$sourceFile"

if ($LASTEXITCODE -eq 0 -and (Test-Path $outFile)) {
    Write-Host "Windows Media Bridge built successfully: $outFile" -ForegroundColor Green
} else {
    Write-Error "Failed to build Windows Media Bridge."
    exit 1
}
