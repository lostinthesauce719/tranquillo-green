"""
Tranquillo Green — 280E Defensibility Animated Walkthrough
Render: manim -qh script.py Scene1 Scene2 Scene3 Scene4 Scene5 Scene6
Preview: manim -ql script.py Scene1
"""

from manim import *

# ─── PALETTE ────────────────────────────────────────────────────────

BG = "#0B1020"
BRAND = "#22855A"
ACCENT = "#D4922A"
DANGER = "#EF4444"
TEXT = "#F1F5F9"
MUTED = "#7C8DB5"
SURFACE = "#141D33"
BORDER = "#1E2D4A"
SUCCESS = "#22C55E"
VIOLET = "#8B5CF6"

MONO = "Menlo"


# ─── HELPERS ────────────────────────────────────────────────────────

def make_bar(label, width, color, height=0.6):
    bar = RoundedRectangle(
        corner_radius=0.1,
        width=width,
        height=height,
        fill_color=color,
        fill_opacity=0.85,
        stroke_width=0,
    )
    txt = Text(label, font_size=18, color=TEXT, font=MONO)
    txt.move_to(bar)
    return VGroup(bar, txt)


def fade_in_group(self, *mobjects, lag=0.15):
    for m in mobjects:
        self.play(FadeIn(m, shift=UP * 0.1), run_time=0.6)
        self.wait(lag)


# ─── SCENE 1: THE PROBLEM ──────────────────────────────────────────

class Scene1_TheProblem(Scene):
    def construct(self):
        self.camera.background_color = BG

        title = Text("IRC §280E", font_size=52, color=ACCENT, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.8)

        self.play(Write(title), run_time=1.5)
        self.wait(1.0)

        # Expense bar
        total_width = 8.0
        total_bar = make_bar("$100 in expenses", total_width, BRAND, height=0.8)
        total_bar.next_to(title, DOWN, buff=1.0)

        self.play(GrowFromCenter(total_bar), run_time=1.5)
        self.wait(1.0)

        # Split into deductible and disallowed
        deduct_width = total_width * 0.4
        disallow_width = total_width * 0.6

        deductible = make_bar("$40 COGS", deduct_width, BRAND, height=0.8)
        disallowed = make_bar("$60 Disallowed", disallow_width, DANGER, height=0.8)

        split = VGroup(deductible, disallowed).arrange(RIGHT, buff=0.1)
        split.next_to(title, DOWN, buff=1.0)

        self.play(
            ReplacementTransform(total_bar, split),
            run_time=1.5,
        )
        self.wait(1.0)

        # Red X on disallowed
        x_mark = Text("✕", font_size=64, color=DANGER, font=MONO)
        x_mark.move_to(disallowed)
        x_mark.set_opacity(0)

        self.play(x_mark.animate.set_opacity(1), run_time=0.8)
        self.wait(1.5)

        # Subtext
        sub = Text(
            "Cannabis businesses can't deduct ordinary expenses",
            font_size=22,
            color=MUTED,
            font=MONO,
        )
        sub.next_to(split, DOWN, buff=0.8)

        self.play(FadeIn(sub, shift=UP * 0.2), run_time=0.8)
        self.wait(2.0)

        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)


# ─── SCENE 2: THE ALLOCATION ───────────────────────────────────────

class Scene2_TheAllocation(Scene):
    def construct(self):
        self.camera.background_color = BG

        title = Text("What if you could prove it?", font_size=44, color=TEXT, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.8)

        self.play(Write(title), run_time=1.5)
        self.wait(1.0)

        # Allocation bar
        bar_width = 7.0
        bar_height = 1.0

        def make_split(deductible_pct):
            d_width = bar_width * deductible_pct
            n_width = bar_width * (1 - deductible_pct)
            d_bar = RoundedRectangle(
                corner_radius=0.15, width=d_width, height=bar_height,
                fill_color=BRAND, fill_opacity=0.85, stroke_width=0,
            )
            n_bar = RoundedRectangle(
                corner_radius=0.15, width=n_width, height=bar_height,
                fill_color=DANGER, fill_opacity=0.7, stroke_width=0,
            )
            split = VGroup(d_bar, n_bar).arrange(RIGHT, buff=0.05)

            d_label = Text(f"{int(deductible_pct*100)}%", font_size=28, color=TEXT, font=MONO, weight=BOLD)
            d_label.move_to(d_bar)
            n_label = Text(f"{int((1-deductible_pct)*100)}%", font_size=28, color=TEXT, font=MONO, weight=BOLD)
            n_label.move_to(n_bar)

            return VGroup(split, d_label, n_label)

        # Square footage (default)
        sqft = make_split(0.65)
        sqft.shift(DOWN * 0.3)
        self.play(GrowFromCenter(sqft), run_time=1.5)
        self.wait(0.5)

        # Method labels
        methods = VGroup(
            Text("Square Footage", font_size=20, color=ACCENT, font=MONO),
            Text("Labor Hours", font_size=20, color=MUTED, font=MONO),
            Text("Revenue Mix", font_size=20, color=MUTED, font=MONO),
        ).arrange(RIGHT, buff=1.5)
        methods.next_to(sqft, DOWN, buff=1.0)

        for m in methods:
            self.play(FadeIn(m, shift=UP * 0.1), run_time=0.4)
        self.wait(1.0)

        # Animate method changes
        self.play(methods[0].animate.set_color(MUTED), run_time=0.3)
        self.play(methods[1].animate.set_color(ACCENT), run_time=0.3)

        labor = make_split(0.73)
        labor.shift(DOWN * 0.3)
        self.play(Transform(sqft, labor), run_time=1.5)
        self.wait(1.5)

        self.play(methods[1].animate.set_color(MUTED), run_time=0.3)
        self.play(methods[2].animate.set_color(ACCENT), run_time=0.3)

        revenue = make_split(0.58)
        revenue.shift(DOWN * 0.3)
        self.play(Transform(sqft, revenue), run_time=1.5)
        self.wait(1.5)

        # Legend
        legend = VGroup(
            VGroup(
                Square(side_length=0.2, fill_color=BRAND, fill_opacity=0.85, stroke_width=0),
                Text("Deductible (COGS)", font_size=16, color=MUTED, font=MONO),
            ).arrange(RIGHT, buff=0.15),
            VGroup(
                Square(side_length=0.2, fill_color=DANGER, fill_opacity=0.7, stroke_width=0),
                Text("280E-Limited (OpEx)", font_size=16, color=MUTED, font=MONO),
            ).arrange(RIGHT, buff=0.15),
        ).arrange(RIGHT, buff=1.0)
        legend.next_to(methods, DOWN, buff=0.6)

        self.play(FadeIn(legend), run_time=0.8)
        self.wait(2.0)

        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)


# ─── SCENE 3: THE REVIEW ───────────────────────────────────────────

class Scene3_TheReview(Scene):
    def construct(self):
        self.camera.background_color = BG

        title = Text("Every decision has a story", font_size=44, color=TEXT, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.8)

        self.play(Write(title), run_time=1.5)
        self.wait(1.0)

        # Card
        card = RoundedRectangle(
            corner_radius=0.2,
            width=8.5,
            height=4.5,
            fill_color=SURFACE,
            fill_opacity=0.9,
            stroke_color=BORDER,
            stroke_width=1.5,
        )
        card.next_to(title, DOWN, buff=0.6)

        self.play(FadeIn(card, scale=0.95), run_time=0.8)
        self.wait(0.5)

        # System recommendation
        rec_label = Text("System Recommendation", font_size=20, color=MUTED, font=MONO)
        rec_label.move_to(card.get_top() + DOWN * 0.6 + LEFT * 2.2)

        rec_pct = Text("73%", font_size=48, color=BRAND, weight=BOLD, font=MONO)
        rec_pct.next_to(rec_label, DOWN, buff=0.2)

        rec_sub = Text("deductible", font_size=18, color=MUTED, font=MONO)
        rec_sub.next_to(rec_pct, DOWN, buff=0.1)

        self.play(FadeIn(rec_label), run_time=0.5)
        self.play(Write(rec_pct), run_time=1.0)
        self.play(FadeIn(rec_sub), run_time=0.3)
        self.wait(1.5)

        # Arrow
        arrow = Arrow(
            card.get_center() + LEFT * 0.5,
            card.get_center() + RIGHT * 0.5,
            color=ACCENT,
            stroke_width=2,
            max_tip_length_to_length_ratio=0.15,
        )
        self.play(Create(arrow), run_time=0.6)
        self.wait(0.5)

        # Override
        ov_label = Text("Tax Manager Override", font_size=20, color=ACCENT, font=MONO)
        ov_label.move_to(card.get_top() + DOWN * 0.6 + RIGHT * 2.2)

        ov_pct = Text("65%", font_size=48, color=ACCENT, weight=BOLD, font=MONO)
        ov_pct.next_to(ov_label, DOWN, buff=0.2)

        ov_sub = Text("deductible", font_size=18, color=MUTED, font=MONO)
        ov_sub.next_to(ov_pct, DOWN, buff=0.1)

        self.play(FadeIn(ov_label), run_time=0.5)
        self.play(Write(ov_pct), run_time=1.0)
        self.play(FadeIn(ov_sub), run_time=0.3)
        self.wait(1.0)

        # Details animate in
        details = VGroup(
            Text('Reason: "Site inspection confirmed remediation zone"', font_size=16, color=MUTED, font=MONO),
            Text("Evidence: Inspection report, updated floor plan", font_size=16, color=MUTED, font=MONO),
            Text("Timestamp: Apr 15, 2:34 PM", font_size=16, color=MUTED, font=MONO),
        ).arrange(DOWN, buff=0.25, aligned_edge=LEFT)
        details.next_to(card.get_bottom(), UP, buff=0.5)

        for d in details:
            self.play(FadeIn(d, shift=RIGHT * 0.2), run_time=0.6)
            self.wait(0.8)

        # Punchline
        punch = Text(
            "Who changed it. Why. When.",
            font_size=24,
            color=ACCENT,
            weight=BOLD,
            font=MONO,
        )
        punch.next_to(card, DOWN, buff=0.6)

        self.play(Write(punch), run_time=1.0)
        self.wait(2.5)

        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)


# ─── SCENE 4: THE AUDIT TRAIL ──────────────────────────────────────

class Scene4_TheAuditTrail(Scene):
    def construct(self):
        self.camera.background_color = BG

        title = Text("The audit trail builds itself", font_size=44, color=TEXT, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.8)

        self.play(Write(title), run_time=1.5)
        self.wait(1.0)

        # Timeline
        timeline_y = 0.5
        timeline = Line(
            LEFT * 5 + DOWN * timeline_y,
            RIGHT * 5 + DOWN * timeline_y,
            color=BORDER,
            stroke_width=2,
        )
        self.play(Create(timeline), run_time=0.8)
        self.wait(0.5)

        # Events
        events = [
            {"x": -3.0, "color": ACCENT, "label": "Override\nRecorded", "actor": "Tax Manager", "date": "Apr 15"},
            {"x": 0.0, "color": SUCCESS, "label": "Approval", "actor": "Controller", "date": "Apr 16"},
            {"x": 3.0, "color": VIOLET, "label": "Policy\nException", "actor": "Controller", "date": "Apr 18"},
        ]

        dots = []
        for i, ev in enumerate(events):
            # Dot
            dot = Dot(
                point=RIGHT * ev["x"] + DOWN * timeline_y,
                radius=0.15,
                color=ev["color"],
            )
            dot.set_opacity(0)

            # Label above
            label = Text(ev["label"], font_size=18, color=ev["color"], font=MONO, weight=BOLD)
            label.next_to(dot, UP, buff=0.4)

            # Actor below
            actor = Text(ev["actor"], font_size=14, color=MUTED, font=MONO)
            actor.next_to(dot, DOWN, buff=0.3)

            # Date below actor
            date = Text(ev["date"], font_size=12, color=MUTED, font=MONO)
            date.next_to(actor, DOWN, buff=0.1)

            self.play(
                dot.animate.set_opacity(1),
                FadeIn(label, shift=UP * 0.2),
                run_time=0.8,
            )
            self.play(FadeIn(actor), FadeIn(date), run_time=0.5)
            self.wait(0.8)

            dots.append(dot)

        # Connect dots with lines
        for i in range(len(dots) - 1):
            line = Line(
                dots[i].get_center(),
                dots[i + 1].get_center(),
                color=MUTED,
                stroke_width=1,
                stroke_opacity=0.4,
            )
            self.play(Create(line), run_time=0.5)

        self.wait(1.5)

        # Subtext
        sub = Text(
            "Every override. Every approval. Every exception.\nTimestamped. Attributed. Unchangeable.",
            font_size=20,
            color=MUTED,
            font=MONO,
            line_spacing=1.5,
        )
        sub.to_edge(DOWN, buff=0.8)

        self.play(FadeIn(sub, shift=UP * 0.2), run_time=0.8)
        self.wait(2.5)

        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)


# ─── SCENE 5: THE PACKET ───────────────────────────────────────────

class Scene5_ThePacket(Scene):
    def construct(self):
        self.camera.background_color = BG

        title = Text("One click → CPA-ready", font_size=44, color=TEXT, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.8)

        self.play(Write(title), run_time=1.5)
        self.wait(1.0)

        # Documents fly in
        docs = [
            ("280E Support Schedule", BRAND),
            ("Override History", ACCENT),
            ("Policy Memos", VIOLET),
            ("Reviewer Sign-off", SUCCESS),
        ]

        doc_mobs = []
        for i, (name, color) in enumerate(docs):
            doc = RoundedRectangle(
                corner_radius=0.12,
                width=3.5,
                height=0.7,
                fill_color=SURFACE,
                fill_opacity=0.9,
                stroke_color=color,
                stroke_width=1.5,
            )
            label = Text(name, font_size=16, color=color, font=MONO)
            label.move_to(doc)

            group = VGroup(doc, label)
            group.move_to(LEFT * 6 + DOWN * (1.5 - i * 1.0))
            group.set_opacity(0)

            doc_mobs.append(group)

        # Fly in from left
        for doc in doc_mobs:
            self.play(
                doc.animate.set_opacity(1).move_to(doc.get_center() + RIGHT * 6),
                run_time=0.6,
            )
            self.wait(0.3)

        self.wait(0.5)

        # Stack into packet
        packet = RoundedRectangle(
            corner_radius=0.2,
            width=5.0,
            height=4.0,
            fill_color=SURFACE,
            fill_opacity=0.95,
            stroke_color=BRAND,
            stroke_width=2,
        )

        packet_label = Text("CPA Handoff Packet", font_size=22, color=BRAND, font=MONO, weight=BOLD)
        packet_label.move_to(packet.get_top() + DOWN * 0.5)

        self.play(
            *[doc.animate.move_to(packet.get_center() + DOWN * (0.5 - i * 0.8)).scale(0.85) for i, doc in enumerate(doc_mobs)],
            FadeIn(packet),
            FadeIn(packet_label),
            run_time=1.5,
        )
        self.wait(1.0)

        # Defensible stamp
        stamp = Text("DEFENSIBLE", font_size=28, color=SUCCESS, weight=BOLD, font=MONO)
        stamp.move_to(packet.get_center() + DOWN * 1.2)
        stamp.set_opacity(0)

        stamp_box = SurroundingRectangle(stamp, color=SUCCESS, buff=0.15, corner_radius=0.1)
        stamp_box.set_opacity(0)

        self.play(
            stamp.animate.set_opacity(1),
            stamp_box.animate.set_opacity(1),
            run_time=0.8,
        )
        self.wait(2.5)

        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)


# ─── SCENE 6: THE CLOSE ────────────────────────────────────────────

class Scene6_TheClose(Scene):
    def construct(self):
        self.camera.background_color = BG

        # Leaf icon (simplified)
        leaf = SVGMobject(
            """<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 1.8 6.5 4.5 8.3C8 17 12 13 12 13s4 4 5.5 7.3C20.2 18.5 22 15.5 22 12c0-5.5-4.5-10-10-10z" fill="#22855A" opacity="0.9"/>
            </svg>""",
            height=1.5,
        )
        leaf.set_opacity(0)

        # Brand name
        brand = Text("Tranquillo Green", font_size=52, color=TEXT, weight=BOLD, font=MONO)
        brand.next_to(leaf, DOWN, buff=0.5)

        self.play(
            leaf.animate.set_opacity(1).scale(1),
            run_time=1.0,
        )
        self.play(Write(brand), run_time=1.5)
        self.wait(1.0)

        # Tagline
        tagline = Text(
            "Obvious. Trustworthy. Defensible.",
            font_size=26,
            color=ACCENT,
            font=MONO,
        )
        tagline.next_to(brand, DOWN, buff=0.6)

        self.play(FadeIn(tagline, shift=UP * 0.15), run_time=0.8)
        self.wait(1.0)

        # Subtext
        sub = Text(
            "280E defensibility for cannabis operators",
            font_size=18,
            color=MUTED,
            font=MONO,
        )
        sub.next_to(tagline, DOWN, buff=0.4)

        self.play(FadeIn(sub), run_time=0.6)
        self.wait(3.0)

        self.play(FadeOut(Group(*self.mobjects)), run_time=1.0)
