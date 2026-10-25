$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot
$taskLocal = Join-Path $taskRoot '.local-backend'
$taskTools = Join-Path $taskLocal 'tools/spacetime-2.13.0'
$taskCli = Join-Path $taskTools 'spacetimedb-cli.exe'
$taskStandalone = Join-Path $taskTools 'spacetimedb-standalone.exe'
New-Item -ItemType Directory -Force -Path $taskLocal,(Join-Path $taskLocal 'config'),(Join-Path $taskLocal 'logs') | Out-Null
if (-not (Test-Path -LiteralPath $taskCli)) {
  $taskArchive = Join-Path $taskLocal 'spacetime-2.13.0.zip'
  Invoke-WebRequest -Uri 'https://github.com/clockworklabs/SpacetimeDB/releases/download/v2.13.0/spacetime-x86_64-pc-windows-msvc.zip' -OutFile $taskArchive
  Expand-Archive -LiteralPath $taskArchive -DestinationPath $taskTools -Force
}
# Persist one signing identity for this isolated local service; never print keys.
node -e "const fs=require('node:fs'),c=require('node:crypto'),d='.local-backend/config';if(!fs.existsSync(d+'/id_ecdsa')){const k=c.generateKeyPairSync('ec',{namedCurve:'prime256v1',publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});fs.writeFileSync(d+'/id_ecdsa',k.privateKey);fs.writeFileSync(d+'/id_ecdsa.pub',k.publicKey)}"
if ($LASTEXITCODE -ne 0) { throw 'Signing key setup failed' }
$taskPidFile = Join-Path $taskLocal 'backend.pid'
$taskExisting = $null
if (Test-Path -LiteralPath $taskPidFile) {
  $taskExisting = Get-Process -Id ([int](Get-Content -LiteralPath $taskPidFile)) -ErrorAction SilentlyContinue
  if ($taskExisting -and $taskExisting.Path -ne $taskStandalone) { throw 'Saved backend PID belongs to a different executable' }
}
if (-not $taskExisting) {
  $taskArgs = @('start','--listen-addr','127.0.0.1:3010','--data-dir',('"' + (Join-Path $taskLocal 'data') + '"'),
    '--jwt-pub-key-path',('"' + (Join-Path $taskLocal 'config/id_ecdsa.pub') + '"'),
    '--jwt-priv-key-path',('"' + (Join-Path $taskLocal 'config/id_ecdsa') + '"'),'--non-interactive')
  $taskExisting = Start-Process -FilePath $taskStandalone -ArgumentList $taskArgs -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput (Join-Path $taskLocal 'logs/backend.stdout.log') -RedirectStandardError (Join-Path $taskLocal 'logs/backend.stderr.log')
  $taskExisting.Id | Set-Content -LiteralPath $taskPidFile
}
$taskReady = $false
for ($taskAttempt = 0; $taskAttempt -lt 40; $taskAttempt++) {
  try { $taskPing = Invoke-WebRequest -Uri 'http://127.0.0.1:3010/v1/ping' -UseBasicParsing; $taskReady = $taskPing.StatusCode -eq 200 } catch { }
  if ($taskReady) { break }
  Start-Sleep -Milliseconds 250
}
if (-not $taskReady) { throw 'Local backend did not become ready; inspect .local-backend/logs' }
if (-not (Test-Path -LiteralPath 'spacetimedb/node_modules/typescript')) {
  npm.cmd ci --prefix spacetimedb --ignore-scripts --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw 'Backend dependency setup failed' }
}
& $taskCli --root-dir (Join-Path $taskLocal 'cli') publish mirrorville-worlds-test --module-path spacetimedb --server http://127.0.0.1:3010 --no-config --delete-data=never --yes
if ($LASTEXITCODE -ne 0) { throw 'Test database publication failed; no data-deletion override is allowed' }
& $taskCli --root-dir (Join-Path $taskLocal 'cli') generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb --no-config --yes
if ($LASTEXITCODE -ne 0) { throw 'Client generation failed' }
@'
VITE_SPACETIMEDB_HOST=ws://127.0.0.1:3010
VITE_SPACETIMEDB_DB_NAME=mirrorville-worlds-test
VITE_SPACETIMEAUTH_CLIENT_ID=
VITE_BACKEND_WORLDS=true
'@ | Set-Content -LiteralPath '.env.worldtest.local' -Encoding utf8
Write-Output 'Local worlds backend ready at http://127.0.0.1:3010 (mirrorville-worlds-test)'
Write-Output 'Frontend: npm.cmd run dev:worlds'
