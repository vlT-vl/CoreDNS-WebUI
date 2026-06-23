#!/bin/bash
cd "$(dirname "$0")" || exit 1

npm install
nohup npm run dev -- --host > npm-dev.log 2>&1 &
echo $! > npm-dev.pid

echo "Avviati:"
echo "npm PID: $(cat npm-dev.pid)"


