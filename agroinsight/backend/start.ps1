param(
    [int]$Port = 3000
)

Set-Location $PSScriptRoot

Write-Host "Starting AgroInsight backend from $PSScriptRoot on port $Port" -ForegroundColor Green
$env:PORT = $Port

$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Warning "Port $Port is already in use. Stop the existing process or pass a different port: .\start.ps1 -Port 3001"
}

node .\server.js
