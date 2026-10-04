#!/usr/bin/env bash
# Rasterizes the SVGs in ../svg to PNGs with transparent backgrounds using headless Chromium.
# Usage: tool/render_png.sh <svg_dir> <png_dir>   (set CHROME to your Chrome/Chromium binary; needs Pillow)
set -euo pipefail
SVG_DIR=$(cd "$1" && pwd); OUT=$2; mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd)
CHROME=${CHROME:-$(ls /opt/pw-browsers/chromium*/chrome-linux/chrome 2>/dev/null | head -1)}
render() { # svg size out [scale-percent]
  local html; html=$(mktemp --suffix=.html)
  printf '<html><body style="margin:0;background:transparent"><img src="file://%s" style="display:block;width:%spx;height:%spx"></body></html>' "$SVG_DIR/$1" "$2" "$2" > "$html"
  "$CHROME" --headless --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --default-background-color=00000000 --window-size="$(($2 + 400)),$(($2 + 400))" --screenshot="$OUT/$3" "file://$html" >/dev/null 2>&1
  rm -f "$html"
  # The headless viewport is smaller than the window, so render into a larger window and crop.
  python3 -c "from PIL import Image; im = Image.open('$OUT/$3'); im.crop((0, 0, $2, $2)).save('$OUT/$3')"
}
render app-icon.svg 192 Icon-192.png
render app-icon.svg 512 Icon-512.png
render app-icon-maskable.svg 192 Icon-maskable-192.png
render app-icon-maskable.svg 512 Icon-maskable-512.png
render app-icon-maskable.svg 180 apple-touch-icon-180.png
render app-icon-circle.svg 512 app-icon-circle-512.png
render app-icon.svg 32 favicon-32.png
render app-icon.svg 16 favicon-16.png
render badge-mono.svg 96 badge-96.png
render logo-mark-olive.svg 512 splash-mark-olive-512.png
render logo-mark-linen.svg 512 splash-mark-linen-512.png
echo "PNGs written to $OUT"
