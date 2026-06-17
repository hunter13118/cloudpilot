#!/usr/bin/env bash
# CloudPilot → GitHub one-click push (macOS/Linux)
# Prereq: create an EMPTY repo at https://github.com/hunter13118/cloudpilot first.
set -e
cd "$(dirname "$0")"
echo "Cleaning any previous git state..."
rm -rf .git
git init -b main
git add -A
git commit -m "feat: CloudPilot - Gemini visual-to-cloud, Cloudflare deploy + auth"
git remote add origin https://github.com/hunter13118/cloudpilot.git 2>/dev/null || true
echo "Pushing (sign in as hunter13118 if prompted)..."
git push -u origin main
echo "Success → https://github.com/hunter13118/cloudpilot"
