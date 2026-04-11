"""
Tranquillo Green — 280E Defensibility (Premium Edition)
========================================================
Cinematic animated walkthrough. Not slides — a visual story.

Render: manim -qh script.py Scene1 Scene2 Scene3 Scene4 Scene5 Scene6
Preview: manim -ql script.py Scene1

Requires: manim >= 0.18, no LaTeX needed (all Text, no MathTex)
"""

from manim import *
import numpy as np
import random

# ─── PALETTE ────────────────────────────────────────────────────────

BG = "#080D19"
SURFACE = "#0E1526"
SURFACE_RAISED = "#141D33"
BORDER = "#1E2D4A"
BRAND = "#22855A"
BRAND_GLOW = "#2ECC71"
ACCENT = "#D4922A"
DANGER = "#EF4444"
TEXT = "#F1F5F9"
TEXT_SECONDARY = "#CBD5E1"
MUTED = "#7C8DB5"
FAINT = "#475569"
SUCCESS = "#22C55E"
VIOLET = "#8B5CF6"
INFO = "#3B82F6"

MONO = "Menlo"
DARK_BG = "#050810"

# ─── HELPERS ────────────────────────────────────────────────────────

class Particles(VGroup):
    """Subtle floating particles for ambient motion."""
    def __init__(self, count=40, **kwargs):
        super().__init__(**kwargs)
        for _ in range(count):
            dot = Dot(
                point=[
                    random.uniform(-7, 7),
                    random.uniform(-4, 4),
                    0
                ],
                radius=random.uniform(0.01, 0.03),
                color=random.choice([BRAND, ACCENT, MUTED, FAINT]),
            )
            dot.set_opacity(random.uniform(0.1, 0.3))
            dot.base_y = dot.get_center()[1]
            dot.speed = random.uniform(0.2, 0.8)
            dot.phase = random.uniform(0, TAU)
            self.add(dot)

    def animate_float(self, scene, duration=3):
        def update_dot(dot, dt):
            y = dot.base_y + 0.15 * np.sin(scene.time * dot.speed + dot.phase)
            dot.move_to([dot.get_center()[0], y, 0])
        for dot in self:
            dot.add_updater(update_dot)


def smooth_card(width=3, height=2, fill=SURFACE_RAISED, stroke=BORDER, radius=0.15):
    return RoundedRectangle(
        corner_radius=radius,
        width=width,
        height=height,
        fill_color=fill,
        fill_opacity=0.95,
        stroke_color=stroke,
        stroke_width=1,
    )


def animated_counter(start, end, duration=1.5, prefix="$", suffix=""):
    """Creates a counting text animation."""
    tracker = ValueTracker(start)
    number = DecimalNumber(
        start,
        num_decimal_places=0,
        font_size=42,
        color=TEXT,
        font=MONO,
    )
    number.add_updater(lambda m: m.set_value(tracker.get_value()))
    return number, tracker


def glow_dot(radius=0.12, color=BRAND):
    dot = Dot(radius=radius, color=color)
    glow = Dot(radius=radius * 3, color=color)
    glow.set_opacity(0.15)
    return VGroup(glow, dot)


# ═══════════════════════════════════════════════════════════════════
# SCENE 1: THE NOTIFICATION — Hook the viewer
# ═══════════════════════════════════════════════════════════════════

class Scene1_TheNotification(Scene):
    def construct(self):
        self.camera.background_color = DARK_BG

        # Particles
        particles = Particles(30)
        self.add(particles)

        # Title sequence — cinematic
        line1 = Text("April 30, 2026.", font_size=20, color=MUTED, font=MONO)
        line2 = Text("Month-end close.", font_size=20, color=MUTED, font=MONO)
        line3 = Text("The IRS has questions.", font_size=20, color=DANGER, font=MONO)

        intro = VGroup(line1, line2, line3).arrange(DOWN, buff=0.3)

        for line in intro:
            self.play(FadeIn(line, shift=RIGHT * 0.3), run_time=0.6)
            self.wait(0.4)

        self.wait(1.5)
        self.play(FadeOut(intro), run_time=0.8)

        # Dashboard mockup appears
        dashboard = smooth_card(width=10, height=5.5, fill=SURFACE)
        sidebar = smooth_card(width=2.2, height=5.5, fill="#0B1020", stroke=BORDER, radius=0.15)
        sidebar.align_to(dashboard, LEFT).shift(RIGHT * 0.05)

        # Sidebar dots (nav items)
        nav_dots = VGroup(*[
            glow_dot(0.05, BRAND if i == 2 else FAINT).move_to(sidebar.get_top() + DOWN * (1.2 + i * 0.5) + RIGHT * 0.3)
            for i in range(6)
        ])

        # Main content area — cards
        card1 = smooth_card(width=3.5, height=1.2, fill=SURFACE_RAISED)
        card1.move_to(dashboard.get_center() + LEFT * 1.8 + UP * 1.2)
        card2 = smooth_card(width=3.5, height=1.2, fill=SURFACE_RAISED)
        card2.move_to(dashboard.get_center() + RIGHT * 1.8 + UP * 1.2)

        # Notification bell with pulse
        bell_pos = dashboard.get_corner(UR) + DOWN * 0.3 + LEFT * 0.5
        bell = Text("🔔", font_size=24).move_to(bell_pos)
        badge = Circle(radius=0.12, color=DANGER, fill_opacity=1).next_to(bell, UR, buff=-0.05)
        badge_num = Text("3", font_size=12, color=TEXT, font=MONO).move_to(badge)

        dashboard_group = VGroup(dashboard, sidebar, nav_dots, card1, card2)
        dashboard_group.shift(DOWN * 0.3)

        self.play(
            FadeIn(dashboard_group, scale=0.95),
            run_time=1.5,
        )
        self.wait(0.5)

        # Bell appears with pulse
        self.play(FadeIn(bell), FadeIn(badge), FadeIn(badge_num), run_time=0.6)

        pulse = Circle(radius=0.3, color=DANGER, stroke_width=2).move_to(bell)
        self.play(
            pulse.animate.scale(2).set_opacity(0),
            run_time=1.0,
        )
        self.wait(0.5)

        # Highlight: 280E allocation needs review
        alert_card = smooth_card(width=5, height=1.0, fill="#1A0F0F", stroke=DANGER)
        alert_card.move_to(dashboard.get_center() + DOWN * 1.2)

        alert_icon = Text("⚠", font_size=20, color=DANGER).move_to(alert_card.get_left() + RIGHT * 0.5)
        alert_text = Text(
            "3 allocations need review before close",
            font_size=16, color=DANGER, font=MONO,
        )
        alert_text.move_to(alert_card.get_center() + RIGHT * 0.3)

        self.play(
            FadeIn(alert_card, shift=UP * 0.2),
            FadeIn(alert_icon),
            FadeIn(alert_text, shift=RIGHT * 0.2),
            run_time=1.0,
        )
        self.wait(2.0)

        # Zoom into the alert
        self.play(
            dashboard_group.animate.set_opacity(0.3),
            alert_card.animate.scale(1.5).move_to(ORIGIN),
            alert_icon.animate.scale(1.5).move_to(ORIGIN + LEFT * 1.8),
            alert_text.animate.scale(1.5).move_to(ORIGIN + RIGHT * 0.5),
            run_time=1.2,
        )
        self.wait(1.5)

        self.play(FadeOut(Group(*self.mobjects)), run_time=0.8)


# ═══════════════════════════════════════════════════════════════════
# SCENE 2: THE PIPELINE — Data flowing through the system
# ═══════════════════════════════════════════════════════════════════

class Scene2_ThePipeline(Scene):
    def construct(self):
        self.camera.background_color = DARK_BG
        particles = Particles(25)
        self.add(particles)

        title = Text("The Pipeline", font_size=48, color=TEXT, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.6)
        self.play(Write(title), run_time=1.2)
        self.wait(0.5)

        # Pipeline stages
        stages = ["Import", "Validate", "Review", "Post"]
        stage_colors = [INFO, ACCENT, VIOLET, SUCCESS]
        stage_mobs = VGroup()

        for i, (name, color) in enumerate(zip(stages, stage_colors)):
            circle = Circle(radius=0.5, fill_color=SURFACE_RAISED, fill_opacity=0.9, stroke_color=color, stroke_width=2)
            label = Text(name, font_size=16, color=color, font=MONO, weight=BOLD)
            label.move_to(circle)
            group = VGroup(circle, label)
            stage_mobs.add(group)

        stage_mobs.arrange(RIGHT, buff=1.5)
        stage_mobs.next_to(title, DOWN, buff=1.2)

        # Arrows between stages
        arrows = VGroup()
        for i in range(len(stage_mobs) - 1):
            arrow = Arrow(
                stage_mobs[i].get_right(),
                stage_mobs[i + 1].get_left(),
                color=MUTED,
                stroke_width=2,
                max_tip_length_to_length_ratio=0.2,
            )
            arrows.add(arrow)

        # Animate pipeline appearing
        for i, stage in enumerate(stage_mobs):
            self.play(
                FadeIn(stage, scale=0.8),
                run_time=0.5,
            )
            if i < len(arrows):
                self.play(Create(arrows[i]), run_time=0.3)
        self.wait(1.0)

        # Data packets flowing through
        for cycle in range(2):
            packet = RoundedRectangle(
                corner_radius=0.08,
                width=0.6,
                height=0.35,
                fill_color=BRAND,
                fill_opacity=0.9,
                stroke_width=0,
            )
            packet.move_to(stage_mobs[0].get_center() + LEFT * 2)

            self.play(FadeIn(packet), run_time=0.3)

            for i in range(len(stage_mobs)):
                target = stage_mobs[i].get_center()
                if i < len(stage_mobs) - 1:
                    target = arrows[i].get_center()

                self.play(
                    packet.animate.move_to(target),
                    run_time=0.6,
                    rate_func=smooth,
                )

                # Flash the stage
                self.play(
                    stage_mobs[i][0].animate.set_fill_opacity(1),
                    run_time=0.15,
                )
                self.play(
                    stage_mobs[i][0].animate.set_fill_opacity(0.9),
                    run_time=0.15,
                )

            # Exit right
            self.play(
                packet.animate.move_to(stage_mobs[-1].get_center() + RIGHT * 2).set_opacity(0),
                run_time=0.5,
            )

        self.wait(0.5)

        # Counter animation — transactions processed
        counter_label = Text("Transactions processed", font_size=18, color=MUTED, font=MONO)
        counter_label.next_to(stage_mobs, DOWN, buff=1.2)

        counter = Text("0", font_size=56, color=BRAND, weight=BOLD, font=MONO)
        counter.next_to(counter_label, DOWN, buff=0.3)

        self.play(FadeIn(counter_label), run_time=0.5)

        # Animate counter
        targets = [147, 12, 8, 167]
        labels = ["Imported", "Flagged", "Reviewed", "Posted"]
        colors = [INFO, ACCENT, VIOLET, SUCCESS]

        counters = VGroup()
        for j, (target, lbl, col) in enumerate(zip(targets, labels, colors)):
            c = Text(str(target), font_size=36, color=col, weight=BOLD, font=MONO)
            l = Text(lbl, font_size=14, color=MUTED, font=MONO)
            pair = VGroup(c, l).arrange(DOWN, buff=0.15)
            counters.add(pair)

        counters.arrange(RIGHT, buff=1.5)
        counters.next_to(counter_label, DOWN, buff=0.5)

        # Replace big counter with breakdown
        self.play(Write(counter), run_time=0.8)
        self.wait(0.5)
        self.play(ReplacementTransform(counter, counters), run_time=1.2)
        self.wait(2.0)

        self.play(FadeOut(Group(*self.mobjects)), run_time=0.8)


# ═══════════════════════════════════════════════════════════════════
# SCENE 3: THE DECISION — Override with evidence
# ═══════════════════════════════════════════════════════════════════

class Scene3_TheDecision(Scene):
    def construct(self):
        self.camera.background_color = DARK_BG
        particles = Particles(20)
        self.add(particles)

        # Title
        title = Text("The Decision", font_size=48, color=TEXT, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.6)
        self.play(Write(title), run_time=1.2)
        self.wait(0.5)

        # Allocation card
        card = smooth_card(width=9, height=5, fill=SURFACE)
        card.next_to(title, DOWN, buff=0.5)

        # Card header
        header_text = Text("Rent & Facility Costs — Oakland", font_size=18, color=TEXT_SECONDARY, font=MONO)
        header_text.move_to(card.get_top() + DOWN * 0.5)
        amount = Text("$42,500", font_size=32, color=TEXT, weight=BOLD, font=MONO)
        amount.next_to(header_text, DOWN, buff=0.2)

        self.play(FadeIn(card), run_time=0.8)
        self.play(FadeIn(header_text), Write(amount), run_time=0.8)
        self.wait(0.5)

        # Split bar — animates from recommendation to override
        bar_width = 7.0
        bar_height = 0.8
        bar_y = card.get_center()[1] + 0.3

        # Recommendation state (73% deductible)
        rec_deduct = bar_width * 0.73
        rec_limit = bar_width * 0.27

        d_bar = RoundedRectangle(
            corner_radius=0.1, width=rec_deduct, height=bar_height,
            fill_color=BRAND, fill_opacity=0.85, stroke_width=0,
        )
        n_bar = RoundedRectangle(
            corner_radius=0.1, width=rec_limit, height=bar_height,
            fill_color=DANGER, fill_opacity=0.6, stroke_width=0,
        )
        split = VGroup(d_bar, n_bar).arrange(RIGHT, buff=0.05)
        split.move_to([0, bar_y, 0])

        d_label = Text("$31,025", font_size=22, color=TEXT, weight=BOLD, font=MONO).move_to(d_bar)
        n_label = Text("$11,475", font_size=22, color=TEXT, weight=BOLD, font=MONO).move_to(n_bar)

        rec_tag = Text("System Recommendation", font_size=14, color=MUTED, font=MONO)
        rec_tag.next_to(split, UP, buff=0.3)

        self.play(
            GrowFromCenter(split),
            FadeIn(d_label),
            FadeIn(n_label),
            FadeIn(rec_tag),
            run_time=1.5,
        )
        self.wait(1.5)

        # Override arrow
        arrow_y = bar_y - 1.0
        override_label = Text("Tax Manager Override", font_size=16, color=ACCENT, font=MONO, weight=BOLD)
        override_label.move_to([0, arrow_y, 0])

        arrow_down = Arrow(
            override_label.get_top() + UP * 0.3,
            override_label.get_top(),
            color=ACCENT,
            stroke_width=2,
        )

        self.play(Create(arrow_down), FadeIn(override_label), run_time=0.8)
        self.wait(0.5)

        # Animate bar morphing to override (65% deductible)
        new_deduct = bar_width * 0.65
        new_limit = bar_width * 0.35

        new_d_bar = RoundedRectangle(
            corner_radius=0.1, width=new_deduct, height=bar_height,
            fill_color=BRAND, fill_opacity=0.85, stroke_width=0,
        )
        new_n_bar = RoundedRectangle(
            corner_radius=0.1, width=new_limit, height=bar_height,
            fill_color=DANGER, fill_opacity=0.75, stroke_width=0,
        )
        new_split = VGroup(new_d_bar, new_n_bar).arrange(RIGHT, buff=0.05)
        new_split.move_to([0, bar_y, 0])

        new_d_label = Text("$27,625", font_size=22, color=TEXT, weight=BOLD, font=MONO).move_to(new_d_bar)
        new_n_label = Text("$14,875", font_size=22, color=TEXT, weight=BOLD, font=MONO).move_to(new_n_bar)

        self.play(
            Transform(d_bar, new_d_bar),
            Transform(n_bar, new_n_bar),
            Transform(d_label, new_d_label),
            Transform(n_label, new_n_label),
            rec_tag.animate.set_color(ACCENT).become(Text("Overridden — 65%", font_size=14, color=ACCENT, font=MONO).move_to(rec_tag)),
            run_time=1.5,
        )
        self.wait(1.0)

        # Evidence items animate in
        evidence_y = arrow_y - 0.8
        evidence_items = [
            ("📋", "Site inspection report — Apr 10"),
            ("📐", "Updated floor plan showing remediation zone"),
            ("💬", "Memo from facilities manager"),
        ]

        for i, (icon, text) in enumerate(evidence_items):
            e_icon = Text(icon, font_size=18).move_to([-3.2, evidence_y - i * 0.5, 0])
            e_text = Text(text, font_size=15, color=MUTED, font=MONO)
            e_text.next_to(e_icon, RIGHT, buff=0.2)
            e_text.align_to(e_icon, UP)

            self.play(
                FadeIn(e_icon, shift=RIGHT * 0.2),
                FadeIn(e_text, shift=RIGHT * 0.2),
                run_time=0.5,
            )
            self.wait(0.3)

        self.wait(2.0)

        # Punchline
        punch = Text("Every dollar. Every decision. Every reason.", font_size=22, color=ACCENT, weight=BOLD, font=MONO)
        punch.to_edge(DOWN, buff=0.6)

        self.play(Write(punch), run_time=1.0)
        self.wait(2.5)

        self.play(FadeOut(Group(*self.mobjects)), run_time=0.8)


# ═══════════════════════════════════════════════════════════════════
# SCENE 4: THE TRAIL — Audit timeline builds itself
# ═══════════════════════════════════════════════════════════════════

class Scene4_TheTrail(Scene):
    def construct(self):
        self.camera.background_color = DARK_BG
        particles = Particles(30)
        self.add(particles)

        title = Text("The Trail", font_size=48, color=TEXT, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.6)
        self.play(Write(title), run_time=1.2)
        self.wait(0.5)

        # Vertical timeline
        timeline_top = title.get_bottom() + DOWN * 0.5
        timeline_bottom = DOWN * 3.5

        timeline = Line(timeline_top, timeline_bottom, color=BORDER, stroke_width=2)
        self.play(Create(timeline), run_time=1.0)
        self.wait(0.3)

        # Events
        events = [
            {
                "time": "Apr 12",
                "action": "CSV Import Completed",
                "detail": "147 rows from Bank of the West",
                "color": INFO,
                "icon": "↑",
            },
            {
                "time": "Apr 15",
                "action": "Allocation Override",
                "detail": "Tax Manager — remediation zone carve-out",
                "color": ACCENT,
                "icon": "✎",
            },
            {
                "time": "Apr 16",
                "action": "Controller Approval",
                "detail": "Labor allocation approved as recommended",
                "color": SUCCESS,
                "icon": "✓",
            },
            {
                "time": "Apr 18",
                "action": "Policy Exception Filed",
                "detail": "Event sponsorship — 60% deductible under revised memo",
                "color": VIOLET,
                "icon": "!",
            },
            {
                "time": "Apr 28",
                "action": "Reconciliation Resolved",
                "detail": "Operating cash balanced — misapplied POS deposit corrected",
                "color": SUCCESS,
                "icon": "✓",
            },
            {
                "time": "Apr 30",
                "action": "CPA Packet Assembled",
                "detail": "280E binder — 3 formats, 4 schedules",
                "color": BRAND,
                "icon": "◆",
            },
        ]

        for i, ev in enumerate(events):
            y_pos = timeline_top[1] - 0.8 - i * 0.9

            # Dot on timeline
            dot = Dot(
                point=[timeline_top[0], y_pos, 0],
                radius=0.1,
                color=ev["color"],
            )
            dot.set_opacity(0)

            # Glow ring
            ring = Circle(radius=0.2, color=ev["color"], stroke_width=1.5)
            ring.move_to(dot)
            ring.set_opacity(0)

            # Event card (alternating sides)
            side = 1 if i % 2 == 0 else -1
            card_x = side * 2.5

            card = smooth_card(width=4.0, height=0.75, fill=SURFACE_RAISED)
            card.move_to([card_x, y_pos, 0])

            # Connector line
            connector = Line(
                dot.get_center(),
                card.get_center() + RIGHT * (-side) * 1.8,
                color=ev["color"],
                stroke_width=1,
                stroke_opacity=0.4,
            )

            # Text in card
            time_text = Text(ev["time"], font_size=12, color=ev["color"], font=MONO)
            time_text.move_to(card.get_top() + DOWN * 0.2 + LEFT * 1.5 * side)

            action_text = Text(ev["action"], font_size=15, color=TEXT, font=MONO, weight=BOLD)
            action_text.move_to(card.get_center() + DOWN * 0.05)

            detail_text = Text(ev["detail"], font_size=11, color=MUTED, font=MONO)
            detail_text.move_to(card.get_bottom() + UP * 0.18)

            # Animate in
            self.play(
                dot.animate.set_opacity(1),
                ring.animate.set_opacity(0.5),
                run_time=0.3,
            )
            self.play(
                ring.animate.scale(1.5).set_opacity(0),
                run_time=0.5,
            )
            self.play(
                Create(connector),
                FadeIn(card, scale=0.9),
                run_time=0.5,
            )
            self.play(
                FadeIn(time_text),
                FadeIn(action_text, shift=RIGHT * 0.15 * side),
                FadeIn(detail_text),
                run_time=0.5,
            )
            self.wait(0.8)

        self.wait(2.0)

        # Fade everything except the trail
        self.play(
            *[mob.animate.set_opacity(0.2) for mob in self.mobjects if mob != timeline and not isinstance(mob, Particles)],
            run_time=1.0,
        )

        # Bottom tagline
        tagline = Text("Immutable. Attributed. Unchangeable.", font_size=24, color=BRAND, weight=BOLD, font=MONO)
        tagline.to_edge(DOWN, buff=0.8)
        self.play(Write(tagline), run_time=1.0)
        self.wait(2.5)

        self.play(FadeOut(Group(*self.mobjects)), run_time=0.8)


# ═══════════════════════════════════════════════════════════════════
# SCENE 5: THE PACKET — Documents assemble into defensible package
# ═══════════════════════════════════════════════════════════════════

class Scene5_ThePacket(Scene):
    def construct(self):
        self.camera.background_color = DARK_BG
        particles = Particles(25)
        self.add(particles)

        title = Text("The Packet", font_size=48, color=TEXT, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.6)
        self.play(Write(title), run_time=1.2)
        self.wait(0.5)

        # Documents scatter around the screen
        docs = [
            ("280E\nSupport Schedule", BRAND),
            ("Allocation\nOverride History", ACCENT),
            ("Policy\nException Memos", VIOLET),
            ("Reviewer\nSign-off Trail", SUCCESS),
            ("Reconciliation\nTie-outs", INFO),
        ]

        doc_mobs = []
        positions = [
            LEFT * 4 + UP * 1.5,
            RIGHT * 4 + UP * 1.5,
            LEFT * 4.5 + DOWN * 1.2,
            RIGHT * 4.5 + DOWN * 1.2,
            DOWN * 3,
        ]

        for (name, color), pos in zip(docs, positions):
            doc = smooth_card(width=2.5, height=1.5, fill=SURFACE_RAISED, stroke=color)
            doc_label = Text(name, font_size=12, color=color, font=MONO, line_spacing=1.2)
            doc_label.move_to(doc)

            group = VGroup(doc, doc_label)
            group.move_to(pos)
            group.set_opacity(0)
            doc_mobs.append(group)

        # Documents appear scattered
        for doc in doc_mobs:
            self.play(FadeIn(doc, scale=0.8), run_time=0.4)
        self.wait(1.0)

        # Counter shows how many docs
        count = Text("5 documents", font_size=20, color=MUTED, font=MONO)
        count.next_to(title, DOWN, buff=0.3)
        self.play(FadeIn(count), run_time=0.5)
        self.wait(0.5)

        # Documents converge into a packet
        packet = smooth_card(width=5, height=6, fill=SURFACE, stroke=BRAND, radius=0.2)
        packet_label = Text("CPA Handoff Packet", font_size=20, color=BRAND, font=MONO, weight=BOLD)
        packet_label.move_to(packet.get_top() + DOWN * 0.5)

        self.play(
            *[doc.animate.scale(0.6).move_to(packet.get_center() + DOWN * (1.5 - i * 0.8)) for i, doc in enumerate(doc_mobs)],
            FadeIn(packet),
            FadeIn(packet_label),
            count.animate.become(Text("1 packet", font_size=20, color=BRAND, font=MONO, weight=BOLD).move_to(count)),
            run_time=2.0,
        )
        self.wait(1.0)

        # Build status
        build_status = Text("Building...", font_size=16, color=ACCENT, font=MONO)
        build_status.next_to(packet, DOWN, buff=0.4)

        # Progress bar
        progress_bg = RoundedRectangle(
            corner_radius=0.05, width=4, height=0.1,
            fill_color=BORDER, fill_opacity=0.5, stroke_width=0,
        )
        progress_bg.next_to(build_status, DOWN, buff=0.2)

        progress_fill = RoundedRectangle(
            corner_radius=0.05, width=0, height=0.1,
            fill_color=BRAND, fill_opacity=0.9, stroke_width=0,
        )
        progress_fill.align_to(progress_bg, LEFT)

        self.play(FadeIn(build_status), FadeIn(progress_bg), run_time=0.5)

        # Animate progress
        self.play(
            progress_fill.animate.stretch_to_fit_width(4),
            run_time=2.0,
            rate_func=smooth,
        )

        # Complete
        self.play(
            build_status.animate.become(Text("✓ Ready for handoff", font_size=16, color=SUCCESS, font=MONO).move_to(build_status)),
            progress_fill.animate.set_fill_color(SUCCESS),
            run_time=0.5,
        )
        self.wait(0.5)

        # Defensible stamp — dramatic
        stamp = Text("DEFENSIBLE", font_size=32, color=SUCCESS, weight=BOLD, font=MONO)
        stamp.move_to(packet.get_center() + DOWN * 1.8)
        stamp_box = SurroundingRectangle(stamp, color=SUCCESS, buff=0.2, corner_radius=0.1, stroke_width=2)

        stamp.set_opacity(0)
        stamp_box.set_opacity(0)

        self.play(
            stamp.animate.set_opacity(1).scale(1.2),
            stamp_box.animate.set_opacity(1).scale(1.2),
            run_time=0.6,
        )
        self.play(
            stamp.animate.scale(1 / 1.2),
            stamp_box.animate.scale(1 / 1.2),
            run_time=0.3,
        )
        self.wait(2.5)

        self.play(FadeOut(Group(*self.mobjects)), run_time=0.8)


# ═══════════════════════════════════════════════════════════════════
# SCENE 6: THE CLOSE — Brand moment
# ═══════════════════════════════════════════════════════════════════

class Scene6_TheClose(Scene):
    def construct(self):
        self.camera.background_color = DARK_BG
        particles = Particles(50)
        self.add(particles)
        particles.animate_float(self, duration=5)

        # Dramatic pause
        self.wait(1.0)

        # Green glow expanding
        glow = Circle(radius=0.1, color=BRAND, fill_opacity=0.3, stroke_width=0)
        self.play(glow.animate.scale(15).set_opacity(0), run_time=2.5)
        self.wait(0.5)

        # Brand name — letter by letter
        brand_letters = VGroup()
        for char in "Tranquillo Green":
            letter = Text(char, font_size=56, color=TEXT, weight=BOLD, font=MONO)
            brand_letters.add(letter)
        brand_letters.arrange(RIGHT, buff=0.05)

        for letter in brand_letters:
            self.play(FadeIn(letter, shift=UP * 0.3), run_time=0.08)
        self.wait(1.0)

        # Tagline
        tagline = Text(
            "Obvious. Trustworthy. Defensible.",
            font_size=26,
            color=ACCENT,
            font=MONO,
        )
        tagline.next_to(brand_letters, DOWN, buff=0.6)

        words = tagline.submobjects.copy()
        for word in words:
            self.play(FadeIn(word, shift=UP * 0.15), run_time=0.15)
        self.wait(1.0)

        # Subtext
        sub = Text(
            "280E defensibility OS for cannabis operators",
            font_size=18,
            color=MUTED,
            font=MONO,
        )
        sub.next_to(tagline, DOWN, buff=0.4)
        self.play(FadeIn(sub), run_time=0.8)
        self.wait(1.0)

        # Stats fly in
        stats = VGroup(
            VGroup(
                Text("$2.4M", font_size=28, color=BRAND, weight=BOLD, font=MONO),
                Text("Deductible defended", font_size=12, color=MUTED, font=MONO),
            ).arrange(DOWN, buff=0.1),
            VGroup(
                Text("167", font_size=28, color=ACCENT, weight=BOLD, font=MONO),
                Text("Transactions posted", font_size=12, color=MUTED, font=MONO),
            ).arrange(DOWN, buff=0.1),
            VGroup(
                Text("6", font_size=28, color=VIOLET, weight=BOLD, font=MONO),
                Text("Audit events tracked", font_size=12, color=MUTED, font=MONO),
            ).arrange(DOWN, buff=0.1),
            VGroup(
                Text("1", font_size=28, color=SUCCESS, weight=BOLD, font=MONO),
                Text("CPA-ready packet", font_size=12, color=MUTED, font=MONO),
            ).arrange(DOWN, buff=0.1),
        ).arrange(RIGHT, buff=1.5)
        stats.next_to(sub, DOWN, buff=0.8)

        for stat in stats:
            self.play(FadeIn(stat, shift=UP * 0.3), run_time=0.4)
        self.wait(3.0)

        # Final fade
        self.play(FadeOut(Group(*self.mobjects)), run_time=1.5)
