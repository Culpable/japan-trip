#!/bin/zsh
set -euo pipefail

# Regenerates the PWA / home-screen icons from the clean Pikachu sprite.
#
# Why this exists: iOS and Android apply their OWN rounded mask to home-screen
# icons. Baking a dark rounded frame into the PNG (as the old icons did) leaves
# that frame sitting just inside the OS mask, so it reads as an ugly black
# outline. Maskable icons must instead be FULL BLEED: a solid background edge to
# edge with the character parked inside the central "safe zone", and no baked
# rounding or border. The OS supplies the corners.
#
# Recipe per icon:
#   1. Start with a full-bleed square of the brand yellow (#ffdb43).
#   2. Trim the sprite to its exact character bounds (drops transparent padding
#      so Pikachu can be sized precisely and centred).
#   3. Scale that character with the point filter (nearest-neighbour keeps the
#      pixel-art crisp) to CHAR_FRACTION of the icon height.
#   4. Composite it dead-centre, leaving generous margins so circular launcher
#      masks never clip the ears or tail.

repo_dir="${0:A:h:h}"
sprite="$repo_dir/assets/pikachu.png"

# Character height as a fraction of the icon. 0.54 keeps Pikachu bold while
# staying well within the ~80% maskable safe zone on every launcher.
CHAR_FRACTION=0.54
BG="#ffdb43"

# name:size pairs. apple-touch-icon is iOS (180px); the others are the
# manifest's maskable icons.
icons=(
  "apple-touch-icon.png:180"
  "app-icon-192.png:192"
  "app-icon-512.png:512"
)

for entry in "${icons[@]}"; do
  name="${entry%%:*}"
  size="${entry##*:}"
  char_h=$(printf '%.0f' "$(echo "$size * $CHAR_FRACTION" | bc -l)")
  out="$repo_dir/assets/$name"

  magick -size "${size}x${size}" "xc:${BG}" \
    \( "$sprite" -background none -fuzz 0% -trim +repage \
       -filter point -resize "x${char_h}" \) \
    -gravity center -compose over -composite \
    -depth 8 -strip "$out"

  echo "built $name (${size}px, Pikachu ${char_h}px tall)"
done
