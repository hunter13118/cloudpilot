@echo off
REM ── CloudPilot → GitHub one-click push ───────────────────────────────
REM Prereqs: (1) git installed, (2) you created an EMPTY repo at
REM          https://github.com/hunter13118/cloudpilot  (no README/.gitignore)
setlocal
cd /d "%~dp0"

echo Cleaning any previous git state...
if exist ".git" rmdir /s /q ".git"

echo Initializing repository...
git init -b main || goto :err
git add -A || goto :err
git commit -m "feat: CloudPilot - Gemini visual-to-cloud, Cloudflare deploy + auth" || goto :err

echo Linking remote (hunter13118/cloudpilot)...
git remote add origin https://github.com/hunter13118/cloudpilot.git

echo Pushing... (a browser/credential prompt may appear - sign in as hunter13118)
git push -u origin main || goto :err

echo.
echo  Success - https://github.com/hunter13118/cloudpilot
pause
exit /b 0

:err
echo.
echo  Something failed above. Common fixes:
echo   - Create the empty repo first at github.com/new  (name: cloudpilot)
echo   - If "remote origin already exists", that's fine - rerun.
echo   - Auth: a GitHub sign-in window should pop up; otherwise use a Personal Access Token.
pause
exit /b 1
