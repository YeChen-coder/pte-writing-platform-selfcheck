$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$indexPath = Join-Path $projectRoot "index.html"

if (-not (Test-Path -LiteralPath $indexPath -PathType Leaf)) {
    throw "Cannot find the practice page: $indexPath"
}

Start-Process -FilePath $indexPath -WorkingDirectory $projectRoot
