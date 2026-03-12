# MindRoots — Start All Services
# Run this from the MindRoots root folder: .\start.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MindRoots — Starting All Services   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Backend (FastAPI) ─────────────────────────────────────────────────
Write-Host "[1/2] Starting Backend (FastAPI) on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root\backend'; Write-Host 'Backend' -ForegroundColor Yellow; .\.venv\Scripts\Activate.ps1; python server.py"
)

# Small delay so backend window opens first
Start-Sleep -Seconds 1

# ── Frontend (Next.js) ────────────────────────────────────────────────
Write-Host "[2/2] Starting Frontend (Next.js) on http://localhost:3000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root'; Write-Host 'Frontend + Admin' -ForegroundColor Green; npm run dev"
)

Write-Host ""
Write-Host "  All services are starting up!" -ForegroundColor Cyan
Write-Host "  Frontend + Admin : http://localhost:3000" -ForegroundColor Green
Write-Host "  Admin Panel      : http://localhost:3000/admin" -ForegroundColor Green
Write-Host "  Backend API      : http://localhost:8000" -ForegroundColor Yellow
Write-Host "  Backend Docs     : http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Close the opened terminal windows to stop the services." -ForegroundColor DarkGray
Write-Host ""
