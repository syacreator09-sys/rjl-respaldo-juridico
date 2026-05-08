param(
  [Parameter(Mandatory = $true)]
  [string]$BotToken
)

$uri = "https://api.telegram.org/bot$BotToken/getUpdates"
Invoke-RestMethod -Uri $uri -Method Get | ConvertTo-Json -Depth 10
