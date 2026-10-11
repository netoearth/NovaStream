@echo off
title NovaStream Cinema Hub
echo ========================================================
echo  NovaStream Local Cinema Hub
echo  Web Application Distribution
echo ========================================================
echo.
echo Attempting to start local web server on http://localhost:3000 ...
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting server with npx serve...
    npx --yes serve -s . -l 3000
    goto end
)
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting server with Python on http://localhost:3000 ...
    python -m http.server 3000
    goto end
)
echo Opening index.html directly...
start index.html
:end
pause
