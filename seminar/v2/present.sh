#!/usr/bin/env bash
# Open the deck locally. Double-clicking deck/dist/index.html also works.
cd "$(dirname "$0")/deck/dist" || exit 1
PORT="${1:-8000}"
echo "Mở http://localhost:$PORT  (Ctrl+C để dừng)"
python3 -m http.server "$PORT"
