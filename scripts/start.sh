#!/bin/bash
echo "========================================================"
echo " Starting NovaStream Cinema Hub (Local Web Server)"
echo "========================================================"
echo ""
if command -v npx >/dev/null 2>&1; then
  echo "Hosting at http://localhost:3000 via npx serve..."
  npx --yes serve -s . -l 3000
elif command -v python3 >/dev/null 2>&1; then
  echo "Hosting at http://localhost:3000 via python3 http.server..."
  python3 -m http.server 3000
elif command -v python >/dev/null 2>&1; then
  echo "Hosting at http://localhost:3000 via python http.server..."
  python -m http.server 3000
else
  echo "Please open index.html directly in your web browser."
fi
