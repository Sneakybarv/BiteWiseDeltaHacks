#!/usr/bin/env bash
set -euo pipefail

# Reset and run local backend (uvicorn) and frontend (Next) in background
# - Kills existing processes on ports 8000/3002 and any saved PID files
# - Loads `backend/.env` (if present)
# - Starts backend and frontend with logs in `logs/` and PIDs in `.local/pids/`

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[reset_and_run] Root: $ROOT"

PID_DIR="$ROOT/.local/pids"
LOG_DIR="$ROOT/logs"
mkdir -p "$PID_DIR" "$LOG_DIR"

kill_pid_file() {
  local pidfile="$1"
  if [ -f "$pidfile" ]; then
    pid=$(cat "$pidfile" 2>/dev/null || true)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "[reset_and_run] Killing PID $pid from $pidfile"
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$pidfile"
  fi
}

kill_pid_file "$PID_DIR/backend.pid"
kill_pid_file "$PID_DIR/frontend.pid"

# Kill by port if still present (portable)
for port in 8000 3002; do
  pids=$(lsof -tiTCP:$port -sTCP:LISTEN -Pn 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "[reset_and_run] Killing processes listening on port $port: $pids"
    kill -9 $pids 2>/dev/null || true
  fi
done

# Load environment variables from backend/.env if present
if [ -f "$ROOT/backend/.env" ]; then
  echo "[reset_and_run] Loading backend/.env"
  # export all variables in .env (ignores comments)
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/backend/.env"
  set +a
fi

echo "[reset_and_run] Starting backend (uvicorn) on port 8000"
cd "$ROOT/backend"
PYTHONPATH="$ROOT/backend" nohup python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > "$LOG_DIR/backend.log" 2>&1 &
backend_pid=$!
echo "$backend_pid" > "$PID_DIR/backend.pid"
disown $backend_pid 2>/dev/null || true
echo "[reset_and_run] Backend PID: $backend_pid (logs: $LOG_DIR/backend.log)"

echo "[reset_and_run] Starting frontend (Next) on port 3002"
cd "$ROOT/frontend"
# pass -p 3002 to `next dev`
nohup npm run dev -- -p 3002 > "$LOG_DIR/frontend.log" 2>&1 &
frontend_pid=$!
echo "$frontend_pid" > "$PID_DIR/frontend.pid"
disown $frontend_pid 2>/dev/null || true
echo "[reset_and_run] Frontend PID: $frontend_pid (logs: $LOG_DIR/frontend.log)"

echo "[reset_and_run] Done. Backend: http://localhost:8000  Frontend: http://localhost:3002"
echo "To stop: kill $(cat $PID_DIR/backend.pid) $(cat $PID_DIR/frontend.pid) or run scripts/reset_and_run.sh --stop"

exit 0
