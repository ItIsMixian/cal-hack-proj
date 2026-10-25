@echo off
cd /d "%~dp0.."
python desktop\observer.py --origin "http://localhost:5173" --origin "http://127.0.0.1:5173" --origin "https://itismixian.github.io" %*
pause
