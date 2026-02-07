$ErrorActionPreference = "Stop"

$Repo = "denizlg24/jabpbw"
$BinName = "jabpbw.exe"
$InstallDir = "$env:LOCALAPPDATA"
$Artifact = "jabpbw-windows-x64.exe"
$Url = "https://github.com/$Repo/releases/latest/download/$Artifact"

Write-Host "Downloading $Artifact..."
Invoke-WebRequest -Uri $Url -OutFile "$InstallDir\$BinName" -UseBasicParsing

$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($UserPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$UserPath;$InstallDir", "User")
    Write-Host "Added $InstallDir to PATH."
}

Write-Host "Installed $BinName to $InstallDir\$BinName"
Write-Host "Restart your terminal, then run: jabpbw"
