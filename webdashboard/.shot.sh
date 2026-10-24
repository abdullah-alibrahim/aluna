#!/bin/bash
# Usage: ./shot.sh <email> <password> <path> <outfile> [width] [height]
set -e
EMAIL="$1"; PASS="$2"; PATH_TO="$3"; OUT="$4"; W="${5:-1440}"; H="${6:-1100}"
API="http://localhost:5010/api"
WEB="http://localhost:5173"

TOKEN=$(curl -s --max-time 20 -X POST "$API/auth/password-login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);if(!j.token){console.error('NO_TOKEN',s.slice(0,200));process.exit(1)}process.stdout.write(j.token)}catch(e){console.error('BAD_JSON',s.slice(0,200));process.exit(1)}})")

if [ -z "$TOKEN" ]; then echo "login failed"; exit 1; fi

cd /Users/aboyassen/Downloads/FreshCut/webdashboard
node -e 'const fs=require("fs");fs.writeFileSync("public/__shot.html","<script>localStorage.setItem(\"aluna_password_token\","+JSON.stringify(process.argv[1])+");location.replace("+JSON.stringify(process.argv[2])+")</script>")' "$TOKEN" "$PATH_TO"

rm -f "$OUT"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars --no-first-run \
  --window-size=${W},${H} --virtual-time-budget=15000 \
  --screenshot="$OUT" "$WEB/__shot.html" > /dev/null 2>&1 || true
ls -la "$OUT" 2>/dev/null || { echo "screenshot failed"; exit 1; }
