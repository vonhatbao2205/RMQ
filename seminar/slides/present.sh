#!/usr/bin/env bash
# Trình chiếu offline: phục vụ thư mục slides qua HTTP cục bộ rồi mở trình duyệt.
# Dùng: ./present.sh [port]      (mặc định 8000)
set -euo pipefail
cd "$(dirname "$0")"
PORT="${1:-8000}"
URL="http://localhost:${PORT}/index.html"
echo "Slide: ${URL}   (Ctrl+C để dừng)"
( sleep 1; xdg-open "$URL" >/dev/null 2>&1 || true ) &
exec python3 -m http.server "$PORT" --bind 127.0.0.1
