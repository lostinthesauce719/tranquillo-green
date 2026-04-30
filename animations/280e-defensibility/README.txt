"""
Tranquillo Green — 280E Defensibility (Premium Edition)
========================================================
Cinematic animated walkthrough. Not slides — a visual story.

Render: manim -qh script.py Scene1 Scene2 Scene3 Scene4 Scene5 Scene6
Preview: manim -ql script.py Scene1

Requires: manim >= 0.18, no LaTeX needed (all Text, no MathTex)
"""

# ─── RENDER COMMANDS ───────────────────────────────────────────────
# PowerShell (Windows):
#   manim -ql script.py Scene1_TheNotification
#   manim -ql script.py Scene2_ThePipeline
#   manim -ql script.py Scene3_TheDecision
#   manim -ql script.py Scene4_TheTrail
#   manim -ql script.py Scene5_ThePacket
#   manim -ql script.py Scene6_TheClose
#
# Stitch with ffmpeg:
#   ffmpeg -y -f concat -safe 0 -i concat.txt -c copy final.mp4
#
# concat.txt contents:
#   file 'media/videos/script/480p15/Scene1_TheNotification.mp4'
#   file 'media/videos/script/480p15/Scene2_ThePipeline.mp4'
#   file 'media/videos/script/480p15/Scene3_TheDecision.mp4'
#   file 'media/videos/script/480p15/Scene4_TheTrail.mp4'
#   file 'media/videos/script/480p15/Scene5_ThePacket.mp4'
#   file 'media/videos/script/480p15/Scene6_TheClose.mp4'
# ──────────────────────────────────────────────────────────────────
