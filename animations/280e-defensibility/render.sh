#!/bin/bash
# Render all scenes for Tranquillo Green 280E Defensibility animation
# Usage: bash render.sh [quality]
#   quality: draft (default), medium, high

QUALITY=${1:-draft}

case $QUALITY in
    draft)   FLAGS="-ql" ;;
    medium)  FLAGS="-qm" ;;
    high)    FLAGS="-qh" ;;
    *)       echo "Usage: bash render.sh [draft|medium|high]"; exit 1 ;;
esac

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "Rendering at quality: $QUALITY"

# Check manim is installed
if ! command -v manim &> /dev/null; then
    echo "ERROR: manim not found. Install with: pip install manim"
    exit 1
fi

# Render each scene
SCENES=(
    "Scene1_TheProblem"
    "Scene2_TheAllocation"
    "Scene3_TheReview"
    "Scene4_TheAuditTrail"
    "Scene5_ThePacket"
    "Scene6_TheClose"
)

for scene in "${SCENES[@]}"; do
    echo "Rendering $scene..."
    manim $FLAGS script.py "$scene"
done

# Stitch together
echo "Stitching scenes..."
QUALITY_DIR="480p15"
if [ "$QUALITY" = "medium" ]; then QUALITY_DIR="720p30"; fi
if [ "$QUALITY" = "high" ]; then QUALITY_DIR="1080p60"; fi

cat > concat.txt << EOF
file 'media/videos/script/$QUALITY_DIR/Scene1_TheProblem.mp4'
file 'media/videos/script/$QUALITY_DIR/Scene2_TheAllocation.mp4'
file 'media/videos/script/$QUALITY_DIR/Scene3_TheReview.mp4'
file 'media/videos/script/$QUALITY_DIR/Scene4_TheAuditTrail.mp4'
file 'media/videos/script/$QUALITY_DIR/Scene5_ThePacket.mp4'
file 'media/videos/script/$QUALITY_DIR/Scene6_TheClose.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i concat.txt -c copy final.mp4

echo "Done! Output: final.mp4"
