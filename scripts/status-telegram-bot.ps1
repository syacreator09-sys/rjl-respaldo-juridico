$projectRoot = "D:\cano-ai-command-center\CLAUDE-CODE-LAUNCHERS\oh-my-claudecode"
$runtimeDir = Join-Path $projectRoot "projects\chatbot-juridico-ai\.runtime"
$pidPath = Join-Path $runtimeDir "telegram-bot.pid"
$stdoutPath = Join-Path $runtimeDir "telegram-bot.stdout.log"
$stderrPath = Join-Path $runtimeDir "telegram-bot.stderr.log"
$heartbeatPath = Join-Path $runtimeDir "telegram-heartbeat.json"

$status = [ordered]@{
  running = $false
  pid = $null
  stdoutPath = $stdoutPath
  stderrPath = $stderrPath
  heartbeat = $null
  stdoutTail = @()
  stderrTail = @()
}

if (Test-Path $pidPath) {
  $pidValue = (Get-Content $pidPath -Raw).Trim()
  if ($pidValue) {
    $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
    if ($process) {
      $status.running = $true
      $status.pid = [int]$pidValue
    }
  }
}

if (Test-Path $stdoutPath) {
  $status.stdoutTail = @(Get-Content $stdoutPath -Tail 20 | ForEach-Object { "$_" })
}

if (Test-Path $stderrPath) {
  $status.stderrTail = @(Get-Content $stderrPath -Tail 20 | ForEach-Object { "$_" })
}

if (Test-Path $heartbeatPath) {
  $status.heartbeat = Get-Content $heartbeatPath -Raw | ConvertFrom-Json
}

$status | ConvertTo-Json -Depth 6
