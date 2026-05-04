$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$processes = Get-CimInstance Win32_Process | Where-Object {
  ($_.Name -like "node*" -or $_.Name -like "npm*") -and
  $_.CommandLine -like "*SN-License-Monitor*" -and
  ($_.CommandLine -like "*next*dev*" -or $_.CommandLine -like "*next-readlink-patch*")
}

foreach ($process in $processes) {
  Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 1

$nextPath = Join-Path $root ".next"
if (Test-Path $nextPath) {
  $resolvedNextPath = (Resolve-Path $nextPath).Path
  if ($resolvedNextPath.StartsWith($root)) {
    Remove-Item -LiteralPath $resolvedNextPath -Recurse -Force
  }
}

Write-Output "Dev server antigo parado e cache .next removido."
