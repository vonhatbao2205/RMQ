#!/usr/bin/env bash
# Render all seminar scenes. Usage: ./render_all.sh [quality-flag] [out-dir]
#   ./render_all.sh -l preview      (480p, fast)
#   ./render_all.sh --hd ../slides/media   (1080p, final)
set -euo pipefail
cd "$(dirname "$0")"
source ./env.sh
Q="${1:---hd}"
OUT="${2:-../slides/media}"
mkdir -p "$OUT" logs
SCENES=$(grep -oE '^class (S[0-9]+_[A-Za-z0-9]+)' rmq_scenes.py | awk '{print $2}')
for s in $SCENES; do
  ( manimgl rmq_scenes.py "$s" -w $Q --video_dir "$OUT" > "logs/$s.log" 2>&1 \
      && echo "ok   $s" || echo "FAIL $s (see logs/$s.log)" ) &
  while [ "$(jobs -rp | wc -l)" -ge 4 ]; do sleep 1; done
done
wait
