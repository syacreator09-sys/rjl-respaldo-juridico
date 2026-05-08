param(
  [Parameter(Mandatory = $true)]
  [string]$BotToken,

  [Parameter(Mandatory = $true)]
  [string]$ChatId,

  [Parameter(Mandatory = $true)]
  [string]$Message
)

$uri = "https://api.telegram.org/bot$BotToken/sendMessage"
$body = @{
  chat_id = $ChatId
  text = $Message
} | ConvertTo-Json

Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 6
