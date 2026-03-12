# MindRoots — Clean Start (kills old servers + clears cache, then starts fresh)
# Run from MindRoots root: .\start.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MindRoots — Clean Start             " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Kill any existing servers ────────────────────────────────
Write-Host "[1/4] Stopping any running servers..." -ForegroundColor Red

# Kill Node.js (Next.js frontend)
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcs) {
    $nodeProcs | Stop-Process -Force
    Write-Host "      ✓ Killed $($nodeProcs.Count) Node.js process(es)" -ForegroundColor DarkGray
} else {
    Write-Host "      · No Node.js processes running" -ForegroundColor DarkGray
}

# Kill Python (FastAPI/uvicorn backend)
$pyProcs = Get-Process -Name "python", "python3", "uvicorn" -ErrorAction SilentlyContinue
if ($pyProcs) {
    $pyProcs | Stop-Process -Force
    Write-Host "      ✓ Killed $($pyProcs.Count) Python process(es)" -ForegroundColor DarkGray
} else {
    Write-Host "      · No Python processes running" -ForegroundColor DarkGray
}

Start-Sleep -Seconds 1

# ── Step 2: Clear Next.js cache ───────────────────────────────────────
Write-Host "[2/4] Clearing Next.js cache (.next)..." -ForegroundColor Yellow
$nextDir = Join-Path $root ".next"
if (Test-Path $nextDir) {
    Remove-Item -Recurse -Force $nextDir
    Write-Host "      ✓ Deleted .next" -ForegroundColor DarkGray
} else {
    Write-Host "      · .next folder not found, skipping" -ForegroundColor DarkGray
}

# ── Step 3: Clear Python caches ───────────────────────────────────────
Write-Host "[3/4] Clearing Python caches (__pycache__)..." -ForegroundColor Yellow
Get-ChildItem -Path $root -Recurse -Directory -Filter "__pycache__" | ForEach-Object {
    Remove-Item -Recurse -Force $_.FullName
    Write-Host "      ✓ Deleted $($_.FullName)" -ForegroundColor DarkGray
}
Get-ChildItem -Path $root -Recurse -File -Filter "*.pyc" | ForEach-Object {
    Remove-Item -Force $_.FullName
}
Write-Host "      ✓ Python cache cleared" -ForegroundColor DarkGray

# ── Step 4: Start all services fresh ─────────────────────────────────
Write-Host "[4/4] Starting all services fresh..." -ForegroundColor Green
Write-Host ""

# Backend
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root\backend'; Write-Host '--- MindRoots Backend ---' -ForegroundColor Yellow; .\.venv\Scripts\Activate.ps1; python server.py"
)

Start-Sleep -Seconds 1

# Frontend
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root'; Write-Host '--- MindRoots Frontend + Admin ---' -ForegroundColor Green; npm run dev"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All services started clean!" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend + Admin : http://localhost:3000" -ForegroundColor Green
Write-Host "  Admin Panel      : http://localhost:3000/admin" -ForegroundColor Green
Write-Host "  Backend API      : http://localhost:8000" -ForegroundColor Yellow
Write-Host "  Backend Docs     : http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Close the opened terminal windows to stop the services." -ForegroundColor DarkGray
Write-Host ""
