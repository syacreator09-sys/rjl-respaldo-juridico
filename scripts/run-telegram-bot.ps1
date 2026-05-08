param(
  [Parameter(Mandatory = $true)]
  [string]$BotToken,

  [string]$AdminChatId = "",

  [string]$Mode = "local",

  [string]$OpenAIKey = "",

  [string]$OpenAIModel = "gpt-4.1-mini"
)

$ErrorActionPreference = "Stop"
$projectRoot = "D:\cano-ai-command-center\CLAUDE-CODE-LAUNCHERS\oh-my-claudecode"
$runtimeDir = Join-Path $projectRoot "projects\chatbot-juridico-ai\.runtime"
$logPath = Join-Path $runtimeDir "telegram-bot.log"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

$env:TELEGRAM_BOT_TOKEN = $BotToken
$env:CHATBOT_JURIDICO_MODE = $Mode

if ($AdminChatId) {
  $env:TELEGRAM_ADMIN_CHAT_ID = $AdminChatId
}

if ($OpenAIKey) {
  $env:OPENAI_API_KEY = $OpenAIKey
  $env:OPENAI_MODEL = $OpenAIModel
}

Set-Location $projectRoot
"[$([DateTime]::Now.ToString('s'))] Starting Telegram bot in mode=$Mode" | Add-Content -Path $logPath
node .\projects\chatbot-juridico-ai\scripts\telegram-bot-polling.mjs 2>&1 | Out-File -FilePath $logPath -Append -Encoding utf8
