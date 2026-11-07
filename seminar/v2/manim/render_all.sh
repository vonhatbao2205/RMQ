#!/usr/bin/env bash
# Render every scene, then slow it down for the talk.
# Usage: ./render_all.sh [quality-flag] [out-dir]
#   ./render_all.sh -l /tmp/preview      (480p, fast)
#   ./render_all.sh --hd                 (1080p, final, into ../deck/dist/media)
# SLOW=2 (default) renders at 60 fps and stretches to half speed at 30 fps, so motion stays smooth.
set -uo pipefail
cd "$(dirname "$0")"
source ./env.sh
Q="${1:---hd}"
OUT="${2:-../deck/dist/media}"
SLOW="${SLOW:-2}"
RAW="$(mktemp -d)"
SUF=""; [ "${RMQ_THEME:-dark}" = light ] && SUF="_light"   # RMQ_THEME=light renders the light-theme copies
mkdir -p "$OUT" logs
SCENES="${SCENES:-$(grep -oE '^class (M[0-9]+_[A-Za-z0-9]+)' scenes.py | awk '{print $2}')}"
for s in $SCENES; do
  ( RMQ_FPS=$((30 * SLOW)) manimgl scenes.py "$s" -w $Q --video_dir "$RAW" > "logs/$s.log" 2>&1 \
      && ffmpeg -v error -y -i "$RAW/$s.mp4" -filter:v "setpts=${SLOW}*PTS" -r 30 -c:v libx264 -crf 20 \
           -preset slow -pix_fmt yuv420p -movflags +faststart -an "$OUT/$s$SUF.mp4" \
      && echo "ok   $s" || echo "FAIL $s (see manim/logs/$s.log)" ) &
  while [ "$(jobs -rp | wc -l)" -ge 5 ]; do sleep 1; done
done
wait
rm -rf "$RAW"
