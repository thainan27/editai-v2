param([Parameter(Position=0)][string]$Command = "help")

function Write-Green($msg)  { Write-Host "OK  $msg" -ForegroundColor Green }
function Write-Yellow($msg) { Write-Host ">>  $msg" -ForegroundColor Yellow }
function Write-Red($msg)    { Write-Host "ERR $msg" -ForegroundColor Red }
function Write-Blue($msg)   { Write-Host "... $msg" -ForegroundColor Cyan }

$ROOT = "C:\Users\Thainan\editai-v2"
Set-Location $ROOT

switch ($Command) {
    "dev"    { Write-Blue "Servidor em http://localhost:8080"; npm run dev }
    "build"  { npm run build; if ($LASTEXITCODE -eq 0) { Write-Green "Build ok!" } else { Write-Red "Falhou!"; exit 1 } }
    "push"   { $d = Get-Date -Format "yyyy-MM-dd HH:mm"; git add .; git commit -m "update: $d"; git push }
    "deploy" {
        npm run build; if ($LASTEXITCODE -ne 0) { Write-Red "Build falhou!"; exit 1 }
        $d = Get-Date -Format "yyyy-MM-dd HH:mm"; git add .; git commit -m "deploy: $d"; git push
        Write-Green "Deploy completo!"
        Write-Blue "Site: https://editai-v2.vercel.app"
    }
    "status" { git status --short; git log --oneline -3 }
    default  {
        Write-Host "Comandos: dev | build | push | deploy | status" -ForegroundColor Cyan
    }
}
