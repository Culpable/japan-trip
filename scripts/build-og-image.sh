#!/bin/zsh
set -euo pipefail

repo_dir="${0:A:h:h}"
preview_dir="$(mktemp -d)"
trap 'rm -rf "$preview_dir"' EXIT

# Quick Look uses macOS's WebKit SVG renderer, keeping the final typography
# identical to the browser while producing a deterministic 1200 px canvas.
qlmanage -t -s 1200 -o "$preview_dir" "$repo_dir/assets/og-image.svg" >/dev/null 2>&1
magick "$preview_dir/og-image.svg.png" -crop 1200x984+0+0 +repage -resize 1200x630! \
  \( "$repo_dir/assets/pikachu.png" -filter point -resize 500x500 \) \
  -geometry +682+63 -composite \
  -stroke '#17284e' -strokewidth 5 -fill '#253d78' \
  -draw "polygon 896,337 921,345 945,337 969,362 954,382 942,371 949,475 892,475 899,371 888,382 872,362" \
  -stroke none -fill '#fffdf7' \
  -draw "polygon 896,337 921,345 945,337 933,382 921,368 910,382" \
  -stroke '#8c2d22' -strokewidth 4 -fill '#cc4a35' \
  -draw "rectangle 892,390 954,414" \
  -stroke '#8c6720' -fill '#c89c3c' \
  -draw "polygon 954,391 974,382 974,421 954,412" \
  -stroke none -fill '#c89c3c' \
  -draw "circle 906,438 911,438 circle 936,457 941,457" \
  -depth 8 -strip "$repo_dir/og-image.png"
