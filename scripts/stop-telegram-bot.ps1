$projectRoot = "D:\cano-ai-command-center\CLAUDE-CODE-LAUNCHERS\oh-my-claudecode"
$pidPath = Join-Path $projectRoot "projects\chatbot-juridico-ai\.runtime\telegram-bot.pid"

if (-not (Test-Path $pidPath)) {
  Write-Output "No PID file found"
  exit 0
}

$pidValue = (Get-Content $pidPath -Raw).Trim()
if (-not $pidValue) {
  Remove-Item -LiteralPath $pidPath -Force
  Write-Output "PID file was empty"
  exit 0
}

$process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
if ($process) {
  Stop-Process -Id $pidValue -Force
  Write-Output "Stopped Telegram bot PID $pidValue"
} else {
  Write-Output "Process $pidValue not running"
}

Remove-Item -LiteralPath $pidPath -Force
