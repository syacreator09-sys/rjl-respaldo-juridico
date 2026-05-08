param(
  [Parameter(Mandatory = $true)]
  [string]$BotToken,

  [string]$AdminChatId = "",

  [string]$Mode = "local",

  [string]$OpenAIKey = "",

  [string]$OpenAIEnvPath = "D:\cano-ai-command-center\.env",

  [string]$OpenAIModel = "gpt-4.1-mini"
)

$ErrorActionPreference = "Stop"
$projectRoot = "D:\cano-ai-command-center\CLAUDE-CODE-LAUNCHERS\oh-my-claudecode"
$runtimeDir = Join-Path $projectRoot "projects\chatbot-juridico-ai\.runtime"
$pidPath = Join-Path $runtimeDir "telegram-bot.pid"
$stdoutPath = Join-Path $runtimeDir "telegram-bot.stdout.log"
$stderrPath = Join-Path $runtimeDir "telegram-bot.stderr.log"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

$existingPid = ""
if (Test-Path $pidPath) {
  $existingPid = (Get-Content $pidPath -Raw).Trim()
}

if ($existingPid) {
  $existing = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Output "Telegram bot already running with PID $existingPid"
    exit 0
  }
}

$env:TELEGRAM_BOT_TOKEN = $BotToken
$env:CHATBOT_JURIDICO_MODE = $Mode
$env:OPENAI_MODEL = $OpenAIModel

if ($AdminChatId) {
  $env:TELEGRAM_ADMIN_CHAT_ID = $AdminChatId
}

if (-not $OpenAIKey -and $Mode -eq "openai" -and (Test-Path $OpenAIEnvPath)) {
  $openAiLine = Select-String -Path $OpenAIEnvPath -Pattern '^OPENAI_API_KEY=' | Select-Object -First 1
  if ($openAiLine) {
    $OpenAIKey = ($openAiLine.Line -replace '^OPENAI_API_KEY=', '').Trim()
  }
}

if ($OpenAIKey) {
  $env:OPENAI_API_KEY = $OpenAIKey
}

$scriptPath = Join-Path $projectRoot "projects\chatbot-juridico-ai\scripts\telegram-bot-polling.mjs"
Set-Location $projectRoot
$process = Start-Process -FilePath "node.exe" `
  -ArgumentList $scriptPath `
  -WorkingDirectory $projectRoot `
  -RedirectStandardOutput $stdoutPath `
  -RedirectStandardError $stderrPath `
  -WindowStyle Hidden `
  -PassThru

Set-Content -Path $pidPath -Value $process.Id
Write-Output "Telegram bot started with PID $($process.Id)"
