@echo off
setlocal
cd /d "%~dp0"
if exist "E5CC-Programme-Studio.exe" ("%~dp0E5CC-Programme-Studio.exe" & exit /b %ERRORLEVEL%)
py -3 app.py
pause
