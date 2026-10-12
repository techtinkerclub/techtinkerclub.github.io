@echo off
setlocal
cd /d "%~dp0"
echo EXPERIMENTAL LAB UPLOAD - DO NOT CONNECT A LIVE HEATER.
echo This is not validated on physical E5CC-TQX3A5M-000 hardware.
choice /M "Proceed to the app's independent safety checks"
if errorlevel 2 exit /b 1
if exist "E5CC-Programme-Studio.exe" ("%~dp0E5CC-Programme-Studio.exe" --enable-lab-writes & exit /b %ERRORLEVEL%)
py -3 app.py --enable-lab-writes
pause
