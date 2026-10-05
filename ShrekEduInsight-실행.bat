@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo Shrek Edu Insight 를 시작합니다. 이 창을 닫으면 사이트가 멈춥니다.
start "" http://localhost:3040
npm run dev
pause
