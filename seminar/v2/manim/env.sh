# Source before running manimgl on NixOS: venv + current OpenGL/X11/Pango libs (see find_libs.py).
_here="/home/bao/Projects/RMQ/seminar/v2/manim"
source /home/bao/Projects/RMQ/.venv/bin/activate
_cache="${XDG_CACHE_HOME:-$HOME/.cache}/rmq-manim-libpath"
if [ ! -s "$_cache" ] || ! ls $(tr ':' ' ' < "$_cache") >/dev/null 2>&1; then
  python "$_here/find_libs.py" > "$_cache"
fi
export LD_LIBRARY_PATH="/run/opengl-driver/lib:$(cat "$_cache")${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
