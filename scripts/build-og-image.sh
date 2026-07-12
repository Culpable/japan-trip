#!/bin/zsh
set -euo pipefail

repo_dir="${0:A:h:h}"
rendered_svg="$(mktemp /tmp/japan-og.XXXXXX.png)"
trap 'rm -f "$rendered_svg"' EXIT

# sips respects the SVG's native 1200 × 630 viewBox. Quick Look renders SVGs
# into a square thumbnail and must not be used here because it distorts artwork.
sips -s format png "$repo_dir/assets/og-image.svg" --out "$rendered_svg" >/dev/null
magick "$rendered_svg" \
  \( "$repo_dir/assets/pikachu.png" -filter point -resize 470x470 \) \
  -geometry +708+85 -composite \
  -depth 8 -strip "$repo_dir/og-image.png"
