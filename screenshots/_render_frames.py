#!/usr/bin/env python3
"""Render CloudPilot portfolio frames, pixel-faithful to the implemented design system.
Draw everything at 2x, downsample LANCZOS -> 1920x1080.
"""
import math
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

S = 2
W, H = 1920, 1080
OUT = "/sessions/practical-sweet-carson/mnt/CloudPilot/screenshots"
os.makedirs(OUT, exist_ok=True)

# ---------------- palette ----------------
BG = (6, 9, 19)
PANEL = (13, 18, 36)
PANEL_HI = (19, 26, 51)
LINE = (60, 70, 110)
TXT = (226, 232, 240)
DIM = (148, 163, 184)
DIMMER = (100, 116, 139)
FAINT = (71, 85, 105)
TELE = (34, 211, 238)
OK = (52, 211, 153)
WARN = (251, 191, 36)
BAD = (248, 113, 113)
VIOLET = (196, 181, 253)
GEM = [(66, 133, 244), (155, 114, 203), (217, 101, 112)]

FD = "/usr/share/fonts/truetype/google-fonts/"
FM = "/usr/share/fonts/truetype/dejavu/"
_cache = {}


def f(kind, size):
    key = (kind, size)
    if key not in _cache:
        paths = {
            "d": FD + "Poppins-Regular.ttf",
            "dm": FD + "Poppins-Medium.ttf",
            "db": FD + "Poppins-Bold.ttf",
            "m": FM + "DejaVuSansMono.ttf",
            "mb": FM + "DejaVuSansMono-Bold.ttf",
        }
        _cache[key] = ImageFont.truetype(paths[kind], int(size * S))
    return _cache[key]


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gem_at(t):
    if t < 0.5:
        return lerp(GEM[0], GEM[1], t * 2)
    return lerp(GEM[1], GEM[2], (t - 0.5) * 2)


class Frame:
    def __init__(self):
        self.img = Image.new("RGB", (W * S, H * S), BG)
        self._nebula()
        self.d = ImageDraw.Draw(self.img, "RGBA")

    def _nebula(self):
        glow = Image.new("RGB", (W * S // 4, H * S // 4), BG)
        gd = ImageDraw.Draw(glow)
        spots = [
            (0.18, -0.05, 280, (26, 43, 80)),
            (0.85, 1.05, 230, (44, 33, 64)),
            (0.70, 0.06, 170, (52, 28, 33)),
        ]
        for fx, fy, r, col in spots:
            gd.ellipse(
                [fx * W * S / 4 - r, fy * H * S / 4 - r, fx * W * S / 4 + r, fy * H * S / 4 + r],
                fill=col,
            )
        glow = glow.filter(ImageFilter.GaussianBlur(90))
        glow = glow.resize((W * S, H * S), Image.BILINEAR)
        from PIL import ImageChops

        self.img = ImageChops.lighter(self.img, glow)

    # ---------- primitives ----------
    def panel(self, x, y, w, h, r=16, fill=(13, 18, 36, 238), line=(120, 140, 255, 40)):
        self.d.rounded_rectangle([x * S, y * S, (x + w) * S, (y + h) * S], r * S, fill=fill, outline=line, width=S)

    def text(self, x, y, s, font, fill, anchor="la"):
        self.d.text((x * S, y * S), s, font=font, fill=fill, anchor=anchor)

    def tracked(self, x, y, s, font, fill, track=3):
        cx = x * S
        for ch in s:
            self.d.text((cx, y * S), ch, font=font, fill=fill)
            cx += self.d.textlength(ch, font=font) + track * S
        return cx / S

    def tlen(self, s, font):
        return self.d.textlength(s, font=font) / S

    def hgrad(self, x, y, w, h, r=10):
        tile = Image.new("RGB", (max(int(w * S), 2), 1))
        for i in range(tile.width):
            tile.putpixel((i, 0), gem_at(i / max(tile.width - 1, 1)))
        tile = tile.resize((int(w * S), max(int(h * S), 1)))
        mask = Image.new("L", tile.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, tile.width - 1, tile.height - 1], r * S, fill=255)
        self.img.paste(tile, (int(x * S), int(y * S)), mask)

    def gem_ring(self, x, y, w, h, r=10):
        steps = 40
        for i in range(steps):
            t0 = i / steps
            seg = [x * S + (w * S) * t0, y * S, x * S + (w * S) * (t0 + 1 / steps), (y + h) * S]
            # draw only border via arc trick: draw full ring as rounded rect outline per-segment color
        # simpler: two-pass — draw rounded rect outline in mid violet, acceptable ring
        self.d.rounded_rectangle([x * S, y * S, (x + w) * S, (y + h) * S], r * S, outline=(155, 114, 203, 230), width=S)
        self.d.rounded_rectangle([x * S, y * S, (x + w) * S, (y + h) * S], r * S, outline=(66, 133, 244, 120), width=S)

    def icon_chip(self, x, y, size, icon, bg=(10, 15, 31, 255)):
        self.d.rounded_rectangle([x * S, y * S, (x + size) * S, (y + size) * S], 9 * S, fill=bg, outline=(140, 110, 200, 200), width=S)
        self.icon(icon, x + size / 2, y + size / 2, size * 0.46)

    def icon(self, name, cx, cy, r, col=(255, 255, 255)):
        d, s = self.d, S
        w = max(int(1.6 * s), 2)
        X, Y, R = cx * s, cy * s, r * s

        def L(pts):
            d.line([(X + px * R, Y + py * R) for px, py in pts], fill=col, width=w, joint="curve")

        if name == "container":
            d.rounded_rectangle([X - R, Y - R * 0.66, X + R, Y + R * 0.66], 2 * s, outline=col, width=w)
            L([(-1, -0.1), (1, -0.1)])
            L([(-0.45, -0.66), (-0.45, 0.66)])
            L([(0.45, -0.66), (0.45, 0.66)])
        elif name == "database":
            d.ellipse([X - R, Y - R, X + R, Y - R * 0.35], outline=col, width=w)
            d.arc([X - R, Y - R * 0.5, X + R, Y + R * 0.2], 0, 180, fill=col, width=w)
            d.arc([X - R, Y + 0.1 * R, X + R, Y + R * 0.85], 0, 180, fill=col, width=w)
            L([(-1, -0.68), (-1, 0.55)])
            L([(1, -0.68), (1, 0.55)])
        elif name == "share":
            for px, py in [(-0.75, 0), (0.75, -0.75), (0.75, 0.75)]:
                d.ellipse([X + px * R - 0.3 * R, Y + py * R - 0.3 * R, X + px * R + 0.3 * R, Y + py * R + 0.3 * R], outline=col, width=w)
            L([(-0.5, -0.12), (0.5, -0.6)])
            L([(-0.5, 0.12), (0.5, 0.6)])
        elif name == "radio":
            d.ellipse([X - 0.28 * R, Y - 0.28 * R, X + 0.28 * R, Y + 0.28 * R], outline=col, width=w)
            for rr in (0.65, 1.0):
                d.arc([X - rr * R, Y - rr * R, X + rr * R, Y + rr * R], -55, 55, fill=col, width=w)
                d.arc([X - rr * R, Y - rr * R, X + rr * R, Y + rr * R], 125, 235, fill=col, width=w)
        elif name == "shield":
            pts = [(0, -1), (0.9, -0.6), (0.9, 0.1), (0, 1), (-0.9, 0.1), (-0.9, -0.6)]
            d.polygon([(X + px * R, Y + py * R) for px, py in pts], outline=col, width=w)
        elif name == "sparkles":
            pts = []
            for i in range(8):
                ang = math.pi / 4 * i - math.pi / 2
                rr = R if i % 2 == 0 else R * 0.38
                pts.append((X + rr * math.cos(ang), Y + rr * math.sin(ang)))
            d.polygon(pts, fill=col)
        elif name == "zap":
            pts = [(0.15, -1), (-0.7, 0.15), (-0.05, 0.15), (-0.15, 1), (0.7, -0.15), (0.05, -0.15)]
            d.polygon([(X + px * R, Y + py * R) for px, py in pts], outline=col, width=w)
        elif name == "server":
            d.rounded_rectangle([X - R, Y - R * 0.85, X + R, Y - R * 0.1], 2 * s, outline=col, width=w)
            d.rounded_rectangle([X - R, Y + R * 0.1, X + R, Y + R * 0.85], 2 * s, outline=col, width=w)
        elif name == "boxes":
            pts = [(0, -0.9), (0.8, -0.45), (0.8, 0.2), (0, 0.65), (-0.8, 0.2), (-0.8, -0.45)]
            d.polygon([(X + px * R * 0.8, Y + py * R * 0.8 - 0.2 * R) for px, py in pts], outline=col, width=w)
            L([(-0.9, 0.55), (0, 1)]); L([(0, 1), (0.9, 0.55)])
        elif name == "chart":
            L([(-1, 0.9), (1, 0.9)])
            for px, hh in [(-0.55, 0.45), (0, 0.95), (0.55, 0.6)]:
                d.line([X + px * R, Y + 0.8 * R, X + px * R, Y + (0.8 - hh * 1.6) * R], fill=col, width=w)
        elif name == "drive":
            d.rounded_rectangle([X - R, Y - R * 0.45, X + R, Y + R * 0.45], 2 * s, outline=col, width=w)
            d.ellipse([X - 0.7 * R - 2 * s, Y - 2 * s, X - 0.7 * R + 2 * s, Y + 2 * s], fill=col)
            L([(0, 0), (0.7, 0)])
        elif name == "brain":
            d.ellipse([X - 0.32 * R, Y - 0.32 * R, X + 0.32 * R, Y + 0.32 * R], outline=col, width=w)
            for ang in range(0, 360, 45):
                a = math.radians(ang)
                d.line([X + 0.5 * R * math.cos(a), Y + 0.5 * R * math.sin(a), X + R * math.cos(a), Y + R * math.sin(a)], fill=col, width=w)
        elif name == "search":
            d.ellipse([X - R, Y - R, X + 0.35 * R, Y + 0.35 * R], outline=col, width=w)
            L([(0.3, 0.3), (1, 1)])
        elif name == "network":
            d.rounded_rectangle([X - 0.35 * R, Y - R, X + 0.35 * R, Y - 0.35 * R], 1.5 * s, outline=col, width=w)
            d.rounded_rectangle([X - R, Y + 0.35 * R, X - 0.25 * R, Y + R], 1.5 * s, outline=col, width=w)
            d.rounded_rectangle([X + 0.25 * R, Y + 0.35 * R, X + R, Y + R], 1.5 * s, outline=col, width=w)
            L([(0, -0.3), (0, 0.05)]); L([(-0.6, 0.35), (-0.6, 0.05), (0.6, 0.05), (0.6, 0.35)])
        elif name == "key":
            d.ellipse([X - R, Y - 0.1 * R, X - 0.1 * R, Y + 0.8 * R], outline=col, width=w)
            L([(-0.35, 0.1), (0.95, -1)]); L([(0.45, -0.55), (0.85, -0.2)])
        elif name == "check":
            L([(-0.7, 0.05), (-0.15, 0.6), (0.8, -0.55)])
        elif name == "x":
            L([(-0.7, -0.7), (0.7, 0.7)]); L([(0.7, -0.7), (-0.7, 0.7)])
        elif name == "camera":
            d.rounded_rectangle([X - R, Y - R * 0.55, X + R, Y + R * 0.65], 2 * s, outline=col, width=w)
            d.ellipse([X - 0.35 * R, Y - 0.25 * R, X + 0.35 * R, Y + 0.45 * R], outline=col, width=w)
            L([(-0.45, -0.55), (-0.25, -0.9), (0.25, -0.9), (0.45, -0.55)])
        elif name == "rocket":
            L([(0, -1), (0.45, -0.2), (0.35, 0.6), (0, 0.4), (-0.35, 0.6), (-0.45, -0.2), (0, -1)])
            d.ellipse([X - 0.12 * R, Y - 0.45 * R, X + 0.12 * R, Y - 0.2 * R], outline=col, width=max(w - s, 1))
        elif name == "warn":
            d.polygon([(X, Y - R), (X + R, Y + R * 0.8), (X - R, Y + R * 0.8)], outline=col, width=w)
            d.line([X, Y - 0.25 * R, X, Y + 0.25 * R], fill=col, width=w)
            d.ellipse([X - 1.5 * s, Y + 0.45 * R, X + 1.5 * s, Y + 0.45 * R + 3 * s], fill=col)
        elif name == "flask":
            L([(-0.25, -0.9), (-0.25, -0.2), (-0.8, 0.8), (0.8, 0.8), (0.25, -0.2), (0.25, -0.9)])
            L([(-0.4, -0.9), (0.4, -0.9)])
        elif name == "gem":
            d.polygon([(X, Y - R), (X + R * 0.75, Y), (X, Y + R), (X - R * 0.75, Y)], fill=col)
        elif name == "steth":
            d.arc([X - R, Y - R, X + 0.2 * R, Y + 0.2 * R], 30, 230, fill=col, width=w)
            d.ellipse([X + 0.4 * R, Y + 0.3 * R, X + R, Y + 0.9 * R], outline=col, width=w)
            L([(-0.4, 0.6), (0.0, 0.9), (0.55, 0.62)])
        elif name == "sat":
            d.rounded_rectangle([X - 0.35 * R, Y - 0.35 * R, X + 0.35 * R, Y + 0.35 * R], 2 * s, outline=col, width=w)
            L([(-1, -0.6), (-0.45, -0.25)]); L([(1, 0.6), (0.45, 0.25)])
            d.rounded_rectangle([X - R, Y - R, X - 0.55 * R, Y - 0.45 * R], 1.5 * s, outline=col, width=w)
            d.rounded_rectangle([X + 0.55 * R, Y + 0.45 * R, X + R, Y + R], 1.5 * s, outline=col, width=w)

    def dotgrid(self, x, y, w, h):
        for gy in range(int(y + 14), int(y + h), 26):
            for gx in range(int(x + 14), int(x + w), 26):
                self.d.ellipse([gx * S - 1.4 * S, gy * S - 1.4 * S, gx * S + 1.4 * S, gy * S + 1.4 * S], fill=(120, 140, 255, 46))

    def gem_text(self, x, y, s, font):
        # gradient text via mask
        tw = self.d.textlength(s, font=font)
        bbox = font.getbbox(s)
        th = bbox[3] + 8
        tile = Image.new("RGB", (max(int(tw), 2), 1))
        for i in range(tile.width):
            tile.putpixel((i, 0), gem_at(i / max(tile.width - 1, 1)))
        tile = tile.resize((tile.width, th))
        mask = Image.new("L", tile.size, 0)
        ImageDraw.Draw(mask).text((0, 0), s, font=font, fill=255)
        self.img.paste(tile, (int(x * S), int(y * S)), mask)
        return tw / S

    def vline(self, x, y, h, col):
        self.d.line([x * S, y * S, x * S, (y + h) * S], fill=col, width=S)

    def hline(self, x, y, w, col):
        self.d.line([x * S, y * S, (x + w) * S, y * S], fill=col, width=S)

    def chip(self, x, y, s, font, col, pad=6):
        w = self.tlen(s, font) + pad * 2
        hh = (font.size / S) + 7
        self.d.rounded_rectangle([x * S, y * S, (x + w) * S, (y + hh) * S], hh / 2 * S, outline=col + (110,), fill=col + (22,), width=S)
        self.text(x + pad, y + 3, s, font, col)
        return w

    def save(self, name):
        out = self.img.resize((W, H), Image.LANCZOS)
        out.save(f"{OUT}/{name}.png")
        print("saved", name)


# ════════════════════════════════════════════════════════════════
# shared layout pieces
# ════════════════════════════════════════════════════════════════
PAD = 14
TOP_H = 56
PAL_W = 240
RIGHT_W = 380
MAIN_Y = PAD + TOP_H + 12
MAIN_H = H - MAIN_Y - PAD
CAN_X = PAD + PAL_W + 12
CAN_W = W - CAN_X - RIGHT_W - 12 - PAD
RX = W - PAD - RIGHT_W

CATALOG = [
    ("COMPUTE", [("Cloud Run", "container", "serverless", TELE), ("GKE Autopilot", "boxes", "managed", VIOLET), ("Cloud Functions", "zap", "serverless", TELE), ("Compute Engine", "server", "iaas", WARN)]),
    ("DATA & STORAGE", [("Cloud SQL", "database", "managed", VIOLET), ("BigQuery", "chart", "serverless", TELE), ("Cloud Storage", "drive", "managed", VIOLET)]),
    ("AI & ML", [("Vertex AI", "brain", "managed", VIOLET), ("Gemini API", "sparkles", "serverless", TELE), ("Discovery Engine", "search", "managed", VIOLET)]),
    ("NETWORKING", [("Cloud Load Balancing", "share", "managed", VIOLET), ("VPC Network", "network", "managed", VIOLET), ("Cloud Armor", "shield", "managed", VIOLET)]),
    ("MESSAGING & OPS", [("Pub/Sub", "radio", "serverless", TELE), ("Secret Manager", "key", "managed", VIOLET)]),
]

NODES = [  # label, type, icon, x, y  (canvas-relative)
    ("Cloud Armor", "cloud_armor", "shield", 60, 60),
    ("Edge LB", "load_balancer", "share", 60, 250),
    ("API Service", "cloud_run", "container", 340, 165),
    ("Worker", "cloud_run", "container", 340, 420),
    ("Orders DB", "cloud_sql", "database", 650, 80),
    ("Event Bus", "pubsub", "radio", 650, 320),
    ("Gemini API", "gemini", "sparkles", 930, 200),
]
EDGES = [(0, 1, "WAF"), (1, 2, "HTTPS"), (2, 4, "private IP"), (2, 5, "publish"), (5, 3, "push sub"), (3, 6, "inference")]
NODE_W, NODE_H = 165, 86


def topbar(fr: Frame, gen_busy=False, deploy_on=True, chaos=False):
    fr.panel(PAD, PAD, W - 2 * PAD, TOP_H)
    # logo
    fr.d.rounded_rectangle([(PAD + 14) * S, (PAD + 12) * S, (PAD + 46) * S, (PAD + 44) * S], 11 * S, fill=(10, 15, 31, 255))
    fr.gem_ring(PAD + 14, PAD + 12, 32, 32, 11)
    fr.icon("gem", PAD + 30, PAD + 28, 11, gem_at(0.35))
    fr.tracked(PAD + 58, PAD + 9, "MILKMAN ENTERPRISE", f("m", 9), DIM, 2.6)
    bw = fr.tlen("Cloud", f("db", 19))
    fr.text(PAD + 58, PAD + 22, "Cloud", f("db", 19), TXT)
    fr.gem_text(PAD + 58 + bw, PAD + 22, "Pilot", f("db", 19))
    # project pill
    px = PAD + 250
    fr.d.rounded_rectangle([px * S, (PAD + 13) * S, (px + 320) * S, (PAD + 43) * S], 15 * S, outline=(120, 140, 255, 40), fill=(13, 18, 36, 180), width=S)
    fr.d.ellipse([(px + 16) * S, (PAD + 25) * S, (px + 22) * S, (PAD + 31) * S], fill=TELE)
    fr.text(px + 32, PAD + 19, "milkman-enterprise-prod", f("m", 12), TXT)
    fr.text(px + 230, PAD + 19, "us-central1", f("m", 12), FAINT)
    fr.chip(px + 336, PAD + 17, "DEMO MODE", f("m", 9), WARN)
    # right buttons
    bx = W - PAD - 14
    # deploy
    bx -= 116
    col = TELE if deploy_on else (60, 80, 95)
    fr.d.rounded_rectangle([bx * S, (PAD + 11) * S, (bx + 116) * S, (PAD + 45) * S], 12 * S, outline=col + (140,), width=S)
    fr.icon("rocket", bx + 22, PAD + 28, 7.5, col)
    fr.text(bx + 38, PAD + 18, "Deploy", f("dm", 13), col)
    # generate
    bx -= 212
    fr.hgrad(bx, PAD + 11, 198, 34, 12)
    label = "Gemini thinking..." if gen_busy else "Generate with Gemini"
    fr.icon("sparkles", bx + 22, PAD + 28, 7, (255, 255, 255))
    fr.text(bx + 36, PAD + 19, label, f("dm", 12.5), (255, 255, 255))
    # vision
    bx -= 196
    fr.d.rounded_rectangle([bx * S, (PAD + 11) * S, (bx + 182) * S, (PAD + 45) * S], 12 * S, outline=(120, 140, 255, 40), width=S)
    fr.icon("camera", bx + 22, PAD + 28, 7, TELE)
    fr.text(bx + 38, PAD + 19, "Import whiteboard", f("d", 12), DIM)
    # chaos
    bx -= 122
    cc = BAD if chaos else DIMMER
    fr.d.rounded_rectangle([bx * S, (PAD + 14) * S, (bx + 108) * S, (PAD + 42) * S], 14 * S, outline=cc + (130,), fill=(cc + (20,)) if chaos else None, width=S)
    fr.icon("flask", bx + 20, PAD + 28, 6.5, cc)
    fr.text(bx + 34, PAD + 20, f"chaos {'ON' if chaos else 'off'}", f("m", 10.5), cc)


def palette(fr: Frame):
    fr.panel(PAD, MAIN_Y, PAL_W, MAIN_H)
    fr.tracked(PAD + 16, MAIN_Y + 14, "SERVICE CATALOG", f("m", 9), DIM, 2.4)
    fr.d.rounded_rectangle([(PAD + 14) * S, (MAIN_Y + 34) * S, (PAD + PAL_W - 14) * S, (MAIN_Y + 62) * S], 9 * S, fill=(10, 15, 31, 255), outline=(120, 140, 255, 40), width=S)
    fr.icon("search", PAD + 30, MAIN_Y + 48, 5.5, FAINT)
    fr.text(PAD + 42, MAIN_Y + 40, "Search GCP services...", f("m", 10.5), FAINT)
    fr.hline(PAD + 1, MAIN_Y + 76, PAL_W - 2, (120, 140, 255, 30))
    y = MAIN_Y + 90
    for cat, svcs in CATALOG:
        if y > MAIN_Y + MAIN_H - 40:
            break
        fr.tracked(PAD + 16, y, cat, f("m", 8.5), DIMMER, 1.8)
        y += 20
        for label, ic, tier, tcol in svcs:
            if y > MAIN_Y + MAIN_H - 56:
                break
            fr.d.rounded_rectangle([(PAD + 12) * S, y * S, (PAD + PAL_W - 12) * S, (y + 48) * S], 12 * S, fill=(13, 18, 36, 160), outline=(120, 140, 255, 36), width=S)
            fr.icon_chip(PAD + 22, y + 10, 28, ic)
            fr.text(PAD + 60, y + 7, label, f("dm", 11.5), TXT)
            tw = fr.tlen(tier, f("m", 8))
            fr.d.rounded_rectangle([(PAD + 60) * S, (y + 26) * S, (PAD + 68 + tw) * S, (y + 40) * S], 4 * S, outline=tcol + (90,), width=S)
            fr.text(PAD + 64, y + 28, tier, f("m", 8), tcol)
            y += 56
        y += 8


def canvas(fr: Frame, with_deck=False):
    ch = MAIN_H - (212 if with_deck else 0)
    fr.panel(CAN_X, MAIN_Y, CAN_W, ch)
    fr.dotgrid(CAN_X + 8, MAIN_Y + 8, CAN_W - 16, ch - 16)
    ox, oy = CAN_X + 30, MAIN_Y + 30
    # edges
    for a, b, lab in EDGES:
        ax = ox + NODES[a][3] + NODE_W
        ay = oy + NODES[a][4] + NODE_H / 2
        bx = ox + NODES[b][3]
        by = oy + NODES[b][4] + NODE_H / 2
        dx = max(40, (bx - ax) / 2)
        pts = []
        steps = 36
        for i in range(steps + 1):
            t = i / steps
            mt = 1 - t
            x = mt**3 * ax + 3 * mt**2 * t * (ax + dx) + 3 * mt * t**2 * (bx - dx) + t**3 * bx
            y = mt**3 * ay + 3 * mt**2 * t * (ay) + 3 * mt * t**2 * (by) + t**3 * by
            pts.append((x, y))
        for i in range(steps):
            if i % 3 == 2:
                continue  # dash gap
            c = gem_at(i / steps)
            fr.d.line([pts[i][0] * S, pts[i][1] * S, pts[i + 1][0] * S, pts[i + 1][1] * S], fill=c, width=int(1.8 * S))
        mx, my = pts[steps // 2]
        lw = fr.tlen(lab, f("m", 9))
        fr.d.rounded_rectangle([(mx - lw / 2 - 5) * S, (my - 8) * S, (mx + lw / 2 + 5) * S, (my + 8) * S], 4 * S, fill=(13, 18, 36, 255))
        fr.text(mx, my, lab, f("m", 9), DIM, anchor="mm")
    # nodes
    for label, typ, ic, nx, ny in NODES:
        x, y = ox + nx, oy + ny
        fr.d.rounded_rectangle([x * S, y * S, (x + NODE_W) * S, (y + NODE_H) * S], 13 * S, fill=(13, 18, 36, 242), outline=(120, 140, 255, 60), width=S)
        fr.icon_chip(x + 12, y + 12, 36, ic)
        fr.text(x + 58, y + 14, label, f("db", 12), TXT)
        fr.text(x + 58, y + 33, typ, f("m", 8.5), DIMMER)
        fr.d.ellipse([(x + 14) * S, (y + 62) * S, (x + 20) * S, (y + 68) * S], fill=OK)
        fr.text(x + 26, y + 58, "standards-ready", f("m", 8.5), DIMMER)
        for hx in (x, x + NODE_W):
            fr.d.ellipse([(hx - 5) * S, (y + NODE_H / 2 - 5) * S, (hx + 5) * S, (y + NODE_H / 2 + 5) * S], fill=TELE, outline=(10, 15, 31), width=S)
    # minimap
    mmx, mmy = CAN_X + CAN_W - 175, MAIN_Y + 14
    fr.panel(mmx, mmy, 160, 108, 10, fill=(13, 18, 36, 230))
    for label, typ, ic, nx, ny in NODES:
        zx = mmx + 14 + nx * 0.115
        zy = mmy + 12 + ny * 0.16
        fr.d.rounded_rectangle([zx * S, zy * S, (zx + 19) * S, (zy + 10) * S], 2 * S, fill=(66, 133, 244, 230))
    # controls
    cx0, cy0 = CAN_X + 14, MAIN_Y + ch - 130
    fr.panel(cx0, cy0, 32, 116, 10)
    for i, g in enumerate(["+", "−", "□", "⊙"]):
        fr.text(cx0 + 16, cy0 + 16 + i * 28, g, f("m", 12), DIM, anchor="mm")
    return ch


REASONING = [
    ("INGEST", TELE, "Ingested 1,229,431 tokens in a single pass — full standards corpus, org policy snapshot and live Terraform state. No RAG chunking required at this scale."),
    ("PARSE", (125, 211, 252), "Parsed canvas graph: 7 services, 6 connections. Topology classified as event-driven microservice mesh."),
    ("GROUND", VIOLET, "Cross-referenced design against 147 enterprise standards via Discovery Engine grounding. 3 standards directly constrain this topology."),
    ("GROUND", VIOLET, "Standard SEC-004 mandates private-IP-only databases — enforcing ipv4_enabled = false and VPC peering on Cloud SQL."),
    ("DESIGN", (240, 171, 252), "Cloud Run ingress restricted to the internal load balancer; min instances pinned to 1 to meet RES-011 cold-start SLO."),
    ("DESIGN", (240, 171, 252), "Synthesized least-privilege IAM: one runtime service account per workload, no primitive roles (IAM-002)."),
    ("VERIFY", OK, "Replayed 12 historical incident postmortems against the proposed design — no recurrence vectors detected."),
    ("EMIT", WARN, "Emitting 9 Terraform resources with cost annotations and a Cloud Build deployment pipeline."),
]
SOURCES = [
    ("Enterprise Standards Corpus (Discovery)", "412k"),
    ("Org Policy & IAM Snapshot", "188k"),
    ("Live Terraform State (entire estate)", "525k"),
    ("Historical Incident Postmortems", "97k"),
    ("Architecture Graph + Canvas Intent", "8k"),
]


def wrap(fr, s, font, maxw):
    words, lines, cur = s.split(), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if fr.tlen(t, font) > maxw and cur:
            lines.append(cur)
            cur = w_
        else:
            cur = t
    lines.append(cur)
    return lines


def right_tabs(fr, active):
    fr.panel(RX, MAIN_Y, RIGHT_W, MAIN_H)
    tabs = [("Copilot", "copilot"), ("Compliance", "compliance"), ("IaC", "iac"), ("Cost", "cost")]
    tw = (RIGHT_W - 16) / 4
    for i, (lab, key) in enumerate(tabs):
        x = RX + 8 + i * tw
        if key == active:
            fr.d.rounded_rectangle([x * S, (MAIN_Y + 7) * S, (x + tw - 4) * S, (MAIN_Y + 39) * S], 11 * S, fill=(19, 26, 51, 255))
            fr.text(x + (tw - 4) / 2, MAIN_Y + 15, lab, f("dm", 11.5), (255, 255, 255), anchor="ma")
        else:
            fr.text(x + (tw - 4) / 2, MAIN_Y + 15, lab, f("d", 11.5), DIM, anchor="ma")
    fr.hline(RX + 1, MAIN_Y + 46, RIGHT_W - 2, (120, 140, 255, 30))
    return MAIN_Y + 60


def copilot_idle(fr):
    y = right_tabs(fr, "copilot")
    cy = MAIN_Y + MAIN_H / 2 - 60
    fr.icon("sparkles", RX + RIGHT_W / 2, cy, 15, (80, 92, 120))
    fr.text(RX + RIGHT_W / 2, cy + 30, "Gemini is on standby.", f("d", 13), DIM, anchor="ma")
    msg = "Draw an architecture, then Generate — the full standards corpus, org policies and live Terraform state ride along in one 2M-token pass."
    yy = cy + 56
    for ln in wrap(fr, msg, f("m", 10), RIGHT_W - 90):
        fr.text(RX + RIGHT_W / 2, yy, ln, f("m", 10), FAINT, anchor="ma")
        yy += 17


def copilot_full(fr):
    y = right_tabs(fr, "copilot")
    fr.tracked(RX + 16, y, "CONTEXT WINDOW · SINGLE PASS", f("m", 9), DIMMER, 2)
    y += 22
    # gauge
    gx, gy, gr = RX + 74, y + 62, 54
    fr.d.arc([(gx - gr) * S, (gy - gr) * S, (gx + gr) * S, (gy + gr) * S], 0, 360, fill=(50, 60, 95), width=9 * S)
    sweep = 360 * (1229431 / 2097152)
    segs = 60
    for i in range(segs):
        a0 = -90 + sweep * i / segs
        a1 = -90 + sweep * (i + 1) / segs
        fr.d.arc([(gx - gr) * S, (gy - gr) * S, (gx + gr) * S, (gy + gr) * S], a0, a1 + 0.8, fill=gem_at(i / segs), width=9 * S)
    fr.text(gx, gy - 14, "1.23M", f("mb", 17), TXT, anchor="ma")
    fr.text(gx, gy + 8, "of 2M tokens", f("m", 8.5), DIMMER, anchor="ma")
    sy = y + 14
    for name, tk in SOURCES:
        nm = name if fr.tlen(name, f("m", 9)) < 190 else name[:34] + "…"
        fr.text(RX + 145, sy, nm, f("m", 9), DIM)
        fr.text(RX + RIGHT_W - 16 - fr.tlen(tk, f("m", 9)), sy, tk, f("m", 9), TELE)
        sy += 21
    y += 134
    fr.tracked(RX + 16, y, "REASONING TRACE · GEMINI-2.5-PRO", f("m", 9), DIMMER, 2)
    y += 22
    for phase, col, txt in REASONING:
        cw = fr.tlen(phase, f("m", 8)) + 10
        fr.d.rounded_rectangle([(RX + 16) * S, y * S, (RX + 16 + cw) * S, (y + 15) * S], 4 * S, outline=col + (110,), width=S)
        fr.text(RX + 21, y + 2, phase, f("m", 8), col)
        lines = wrap(fr, txt, f("m", 9.5), RIGHT_W - cw - 46)
        ly = y
        for ln in lines:
            fr.text(RX + 24 + cw, ly, ln, f("m", 9.5), (203, 213, 225))
            ly += 16
        y = max(y + 18, ly) + 6
    # summary
    fr.d.rounded_rectangle([(RX + 16) * S, y * S, (RX + RIGHT_W - 16) * S, (y + 64) * S], 11 * S, fill=(13, 18, 36, 220))
    fr.vline(RX + 16, y, 64, (155, 114, 203, 255))
    fr.vline(RX + 17, y, 64, (155, 114, 203, 255))
    summ = "Designed a 7-service architecture grounded in 147 enterprise standards, emitted 9 Terraform resources, projected $797.30/mo."
    yy = y + 9
    for ln in wrap(fr, summ, f("d", 10.5), RIGHT_W - 60):
        fr.text(RX + 30, yy, ln, f("d", 10.5), (203, 213, 225))
        yy += 16


FINDINGS = [
    ("PASS", OK, "IAM-002", "Least-privilege service accounts", "Dedicated runtime SA generated; zero primitive roles in plan.", False),
    ("PASS", OK, "SEC-001", "Encryption at rest", "All stateful services use Google-managed CMEK-ready encryption.", False),
    ("PASS", OK, "SEC-004", "Database network isolation", "Cloud SQL pinned to private IP with VPC peering — public path removed by Gemini during synthesis.", False),
    ("PASS", OK, "SEC-009", "Edge WAF attached", "Cloud Armor baseline OWASP rule set fronts the global load balancer.", False),
    ("WARN", WARN, "COST-008", "Object lifecycle missing", "Event archive bucket has no Nearline transition rule. Gemini can inject a 90-day lifecycle policy.", True),
]


def compliance_panel(fr):
    y = right_tabs(fr, "compliance")
    fr.text(RX + 18, y - 4, "94", f("mb", 34), OK)
    fr.text(RX + 78, y + 4, "Standards alignment", f("db", 12), TXT)
    fr.text(RX + 78, y + 22, "grounded via Discovery Engine · 5 findings", f("d", 10), DIM)
    y += 56
    for sev, col, std, title, det, fix in FINDINGS:
        lines = wrap(fr, det, f("d", 10), RIGHT_W - 60)
        hh = 52 + len(lines) * 15 + 16
        fr.d.rounded_rectangle([(RX + 14) * S, y * S, (RX + RIGHT_W - 14) * S, (y + hh) * S], 12 * S, fill=(13, 18, 36, 190), outline=(120, 140, 255, 36), width=S)
        fr.icon("check" if sev == "PASS" else "warn", RX + 30, y + 18, 6, col)
        fr.text(RX + 44, y + 10, title, f("dm", 11.5), TXT)
        sw = fr.tlen(sev, f("m", 8)) + 14
        fr.d.rounded_rectangle([(RX + RIGHT_W - 22 - sw) * S, (y + 10) * S, (RX + RIGHT_W - 22) * S, (y + 26) * S], 8 * S, outline=col + (110,), fill=col + (20,), width=S)
        fr.text(RX + RIGHT_W - 15 - sw + 7, y + 12, sev, f("m", 8), col)
        ly = y + 32
        for ln in lines:
            fr.text(RX + 28, ly, ln, f("d", 10), DIM)
            ly += 15
        fr.text(RX + 28, ly + 4, std, f("m", 8.5), FAINT)
        if fix:
            lab = "◆ Gemini autofix"
            fr.text(RX + RIGHT_W - 28 - fr.tlen(lab, f("m", 9.5)), ly + 2, lab, f("m", 9.5), VIOLET)
        y += hh + 9


TF_LINES = [
    ("terraform {", "k1"),
    ("  required_providers {", None),
    ('    google = { source = "hashicorp/google", version = "~> 6.0" }', "s"),
    ("  }", None),
    ("}", None),
    ("", None),
    ('variable "project_id" { type = string }', "kv"),
    ('variable "region"     { type = string, default = "us-central1" }', "kv"),
    ("", None),
    ("# Generated by CloudPilot · grounded in 147 enterprise standards", "c"),
    ('resource "google_service_account" "runtime" {', "kv"),
    ('  account_id   = "cloudpilot-runtime"', "s"),
    ('  display_name = "CloudPilot runtime (least privilege)"', "s"),
    ("}", None),
    ("", None),
    ('resource "google_cloud_run_v2_service" "api-service" {', "kv"),
    ('  name     = "api-service"', "s"),
    ("  location = var.region", None),
    ("  template {", None),
    ("    containers {", None),
    ('      image = "gcr.io/${var.project_id}/api-service:latest"', "s"),
    ('      resources { limits = { cpu = "2", memory = "1Gi" } }', "s"),
    ("    }", None),
    ("    scaling { min_instance_count = 1, max_instance_count = 20 }", "n"),
    ("  }", None),
    ('  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"  # SEC-004', "sc"),
    ("}", None),
    ("", None),
    ('resource "google_sql_database_instance" "orders-db" {', "kv"),
    ('  name             = "orders-db"', "s"),
    ('  database_version = "POSTGRES_16"', "s"),
    ("  region           = var.region", None),
    ("  settings {", None),
    ('    tier = "db-custom-2-8192"', "s"),
    ("    ip_configuration {", None),
    ("      ipv4_enabled    = false                # SEC-004", "kc"),
    ("      private_network = google_compute_network.vpc.id", None),
    ("    }", None),
    ("    backup_configuration { enabled = true }  # RES-002", "kc"),
    ("  }", None),
    ("}", None),
]


def iac_panel(fr):
    y = right_tabs(fr, "iac")
    fr.text(RX + 18, y - 2, "main.tf", f("m", 11), TELE)
    fr.text(RX + RIGHT_W - 60, y - 2, "copy", f("m", 10), DIMMER)
    fr.hline(RX + 1, y + 20, RIGHT_W - 2, (120, 140, 255, 30))
    yy = y + 32
    fnt = f("m", 9.5)
    for txt, kind in TF_LINES:
        if yy > MAIN_Y + MAIN_H - 24:
            break
        col = (203, 213, 225)
        if kind == "c":
            col = FAINT
        # crude but effective: color keywords/strings per line kind
        if kind in ("kv", "k1"):
            # keyword + strings
            parts = txt.split('"')
            x = RX + 18
            for i, p in enumerate(parts):
                c = (110, 231, 183) if i % 2 == 1 else (VIOLET if i == 0 else col)
                s_ = ('"' + p + '"') if i % 2 == 1 else p
                if i % 2 == 1:
                    fr.text(x, yy, '"' + p + '"', fnt, (110, 231, 183))
                    x += fr.tlen('"' + p + '"', fnt)
                else:
                    fr.text(x, yy, p, fnt, VIOLET if i == 0 else col)
                    x += fr.tlen(p, fnt)
        elif kind in ("s", "sc"):
            parts = txt.split('"')
            x = RX + 18
            for i, p in enumerate(parts):
                if i % 2 == 1:
                    fr.text(x, yy, '"' + p + '"', fnt, (110, 231, 183))
                    x += fr.tlen('"' + p + '"', fnt)
                else:
                    seg = p
                    if "#" in seg and kind == "sc":
                        pre, post = seg.split("#", 1)
                        fr.text(x, yy, pre, fnt, col)
                        x += fr.tlen(pre, fnt)
                        fr.text(x, yy, "#" + post, fnt, FAINT)
                        x += fr.tlen("#" + post, fnt)
                    else:
                        fr.text(x, yy, seg, fnt, col)
                        x += fr.tlen(seg, fnt)
        elif kind == "kc":
            if "#" in txt:
                pre, post = txt.split("#", 1)
                fr.text(RX + 18, yy, pre, fnt, col)
                fr.text(RX + 18 + fr.tlen(pre, fnt), yy, "#" + post, fnt, FAINT)
            else:
                fr.text(RX + 18, yy, txt, fnt, col)
        elif kind == "n":
            fr.text(RX + 18, yy, txt, fnt, (250, 200, 120))
        else:
            fr.text(RX + 18, yy, txt, fnt, col)
        yy += 17


PLAN = [
    ("preflight-policy", "Policy gate · org constraints replay", "PREFLIGHT"),
    ("preflight-plan", "terraform plan · drift check", "PREFLIGHT"),
    ("ignition-build", "Cloud Build · container bake", "IGNITION"),
    ("ignition-scan", "Artifact scan · CVE sweep", "IGNITION"),
    ("ascent-apply", "terraform apply · provisioning", "ASCENT"),
    ("ascent-smoke", "Smoke probes · golden signals", "ASCENT"),
    ("orbit-traffic", "Traffic shift · 100% to new revision", "ORBIT"),
]


def flight_deck(fr, failed_at=None):
    dy = MAIN_Y + MAIN_H - 200
    fr.panel(CAN_X, dy, CAN_W, 200)
    done_all = failed_at is None
    fr.icon("sat", CAN_X + 26, dy + 24, 8, OK if done_all else BAD)
    fr.tracked(CAN_X + 44, dy + 17, "FLIGHT DECK", f("m", 9), DIM, 2.4)
    # phases
    px = CAN_X + 190
    for i, p in enumerate(["PREFLIGHT", "IGNITION", "ASCENT", "ORBIT"]):
        if failed_at and p == "ASCENT":
            col, fillc = BAD, BAD + (22,)
        elif done_all or (failed_at and i < 2):
            col, fillc = OK, None
        else:
            col, fillc = DIMMER, None
        wch = fr.chip(px, dy + 15, p, f("m", 9), col if isinstance(col, tuple) else DIMMER)
        px += wch + 6
        if i < 3:
            fr.hline(px, dy + 26, 14, (70, 85, 120))
            px += 20
    # progress
    prog = 100 if done_all else 57
    bar_x, bar_w = px + 14, CAN_X + CAN_W - px - 110
    fr.d.rounded_rectangle([bar_x * S, (dy + 22) * S, (bar_x + bar_w) * S, (dy + 30) * S], 4 * S, fill=(19, 26, 51, 255))
    if done_all:
        fr.hgrad(bar_x, dy + 22, bar_w, 8, 4)
    else:
        fr.d.rounded_rectangle([bar_x * S, (dy + 22) * S, (bar_x + bar_w * prog / 100) * S, (dy + 30) * S], 4 * S, fill=BAD)
    fr.text(bar_x + bar_w + 12, dy + 16, f"{prog}%", f("m", 11), DIM)
    # steps
    sy = dy + 52
    for i, (sid, name, ph) in enumerate(PLAN):
        if failed_at is not None:
            st = "success" if i < failed_at else ("failed" if i == failed_at else "pending")
        else:
            st = "success"
        col = OK if st == "success" else BAD if st == "failed" else FAINT
        if st == "success":
            fr.icon("check", CAN_X + 26, sy + 7, 5.5, OK)
        elif st == "failed":
            fr.icon("x", CAN_X + 26, sy + 7, 5, BAD)
        else:
            fr.d.ellipse([(CAN_X + 21) * S, (sy + 2) * S, (CAN_X + 31) * S, (sy + 12) * S], outline=FAINT, width=S)
        fr.text(CAN_X + 42, sy, name, f("m", 10), (203, 213, 225) if st == "success" else (BAD if st == "failed" else FAINT))
        if st == "success":
            dur = f"{1.8 + i * 0.4:.1f}s"
            fr.text(CAN_X + 460 - fr.tlen(dur, f("m", 9.5)), sy, dur, f("m", 9.5), FAINT)
        if st == "failed":
            lab = "🩺 Diagnose with Gemini"
            lw = fr.tlen("Diagnose with Gemini", f("m", 9.5)) + 36
            bx = CAN_X + 470
            fr.d.rounded_rectangle([bx * S, (sy - 3) * S, (bx + lw) * S, (sy + 16) * S], 8 * S, outline=BAD + (140,), width=S)
            fr.icon("steth", bx + 14, sy + 6.5, 5, (253, 164, 175))
            fr.text(bx + 26, sy - 1, "Diagnose with Gemini", f("m", 9.5), (253, 164, 175))
        sy += 20
    # telemetry
    tx = CAN_X + CAN_W / 2 + 20
    fr.d.rounded_rectangle([tx * S, (dy + 48) * S, (CAN_X + CAN_W - 16) * S, (dy + 186) * S], 12 * S, fill=(6, 9, 19, 200), outline=(120, 140, 255, 36), width=S)
    fr.tracked(tx + 14, dy + 58, "TELEMETRY", f("m", 8), FAINT, 2.2)
    ty = dy + 76
    upto = len(PLAN) if failed_at is None else failed_at + 1
    shown = PLAN[:upto][-5:] if failed_at is None else PLAN[:upto][-5:]
    for i, (sid, name, ph) in enumerate(shown):
        gi = PLAN.index((sid, name, ph))
        if failed_at is not None and gi == failed_at:
            fr.text(tx + 14, ty, f"[{sid}] ERROR: step failed — see diagnosis", f("m", 9.5), (253, 164, 175))
        else:
            fr.text(tx + 14, ty, f"[{sid}] ✓ {name}", f("m", 9.5), DIM)
        ty += 18
    if failed_at is None:
        fr.text(tx + 14, ty, "[orbit] ◉ ORBIT CONFIRMED — architecture live in", f("m", 9.5), OK)
        fr.text(tx + 14, ty + 17, "        milkman-enterprise-prod · telemetry nominal", f("m", 9.5), OK)


DIFF = [
    ("ctx", 'resource "google_sql_database_instance" "orders-db" {'),
    ("del", '-   name             = "orders-db"'),
    ("add", '+   name             = "orders-db-${random_id.db_suffix.hex}"'),
    ("ctx", '    database_version = "POSTGRES_16"'),
    ("add", "+ "),
    ("add", '+ resource "random_id" "db_suffix" { byte_length = 2 }'),
]


def diagnosis_modal(fr):
    # dim
    fr.d.rectangle([0, 0, W * S, H * S], fill=(6, 9, 19, 175))
    mw, mh = 780, 760
    mx, my = (W - mw) / 2, (H - mh) / 2
    fr.panel(mx, my, mw, mh, 18, fill=(13, 18, 36, 252), line=(155, 114, 203, 160))
    fr.gem_ring(mx, my, mw, mh, 18)
    # head
    fr.d.rounded_rectangle([(mx + 20) * S, (my + 16) * S, (mx + 56) * S, (my + 52) * S], 12 * S, fill=(10, 15, 31, 255))
    fr.gem_ring(mx + 20, my + 16, 36, 36, 12)
    fr.icon("steth", mx + 38, my + 34, 9, gem_at(0.4))
    fr.text(mx + 68, my + 16, "Gemini Diagnosis", f("db", 14), TXT)
    fr.text(mx + 68, my + 38, "full build log + audit trail + standards corpus · one context window", f("m", 9), DIMMER)
    fr.chip(mx + mw - 160, my + 22, "97% confidence", f("m", 9.5), VIOLET)
    fr.icon("x", mx + mw - 30, my + 30, 5.5, DIMMER)
    fr.hline(mx + 1, my + 64, mw - 2, (120, 140, 255, 30))
    y = my + 82
    # root cause
    fr.d.rounded_rectangle([(mx + 22) * S, y * S, (mx + mw - 22) * S, (y + 108) * S], 12 * S, fill=(16, 21, 40, 255), outline=(120, 140, 255, 36), width=S)
    fr.vline(mx + 22, y + 1, 106, BAD)
    fr.vline(mx + 23, y + 1, 106, BAD)
    fr.text(mx + 38, y + 12, "Cloud SQL instance name collision in region us-central1", f("db", 13.5), (253, 164, 175))
    detail = "terraform apply failed because instance name 'orders-db' was used by a deleted instance still inside its 7-day reservation window. Gemini correlated the apply log with the project's audit trail (ingested in-context) and found the deletion event from 2026-06-07."
    yy = y + 38
    for ln in wrap(fr, detail, f("d", 10.5), mw - 80):
        fr.text(mx + 38, yy, ln, f("d", 10.5), DIM)
        yy += 16
    y += 124
    fr.tracked(mx + 24, y, "EVIDENCE · BUILD LOG", f("m", 8.5), DIMMER, 2)
    y += 20
    logs = [
        ("google_sql_database_instance.orders-db: Creating...", DIM),
        ("╷", DIM),
        ("│ Error: Error, failed to create instance orders-db:", (253, 164, 175)),
        ("│ googleapi: Error 409: The Cloud SQL instance already exists.", (253, 164, 175)),
        ("│ When you delete an instance, you can't reuse the name for up to a week.", (253, 164, 175)),
        ("╵", DIM),
    ]
    fr.d.rounded_rectangle([(mx + 22) * S, y * S, (mx + mw - 22) * S, (y + 8 + len(logs) * 17 + 8) * S], 12 * S, fill=(6, 9, 19, 220), outline=(120, 140, 255, 36), width=S)
    yy = y + 10
    for ln, col in logs:
        fr.text(mx + 38, yy, ln, f("m", 9.5), col)
        yy += 17
    y = yy + 18
    fr.tracked(mx + 24, y, "PROPOSED PATCH · MAIN.TF", f("m", 8.5), DIMMER, 2)
    y += 20
    fr.d.rounded_rectangle([(mx + 22) * S, y * S, (mx + mw - 22) * S, (y + len(DIFF) * 19 + 12) * S], 12 * S, fill=(10, 14, 28, 255), outline=(120, 140, 255, 36), width=S)
    yy = y + 7
    for kind, txt in DIFF:
        if kind == "add":
            fr.d.rectangle([(mx + 23) * S, yy * S, (mx + mw - 23) * S, (yy + 18) * S], fill=(52, 211, 153, 22))
            col = (110, 231, 183)
        elif kind == "del":
            fr.d.rectangle([(mx + 23) * S, yy * S, (mx + mw - 23) * S, (yy + 18) * S], fill=(248, 113, 113, 22))
            col = (253, 164, 175)
        else:
            col = DIM
        fr.text(mx + 38, yy + 2, txt, f("m", 9.5), col)
        yy += 19
    y = yy + 16
    expl = "Suffix the instance name with a stable random id so re-creations never collide with the 7-day name reservation. Matches naming standard NAM-006 (immutable-resource suffixing)."
    for ln in wrap(fr, expl, f("d", 10), mw - 60):
        fr.text(mx + 26, y, ln, f("d", 10), DIM)
        y += 15
    y += 10
    x = mx + 26
    for ref in ["NAM-006 · Immutable resource naming with entropy suffixes", "RES-002 · Recoverable delete windows"]:
        rw = fr.tlen(ref, f("m", 9)) + 24
        fr.d.rounded_rectangle([x * S, y * S, (x + rw) * S, (y + 22) * S], 11 * S, outline=(120, 140, 255, 60), width=S)
        fr.text(x + 12, y + 5, ref, f("m", 9), DIM)
        x += rw + 10
    # footer
    fy = my + mh - 56
    fr.hline(mx + 1, fy, mw - 2, (120, 140, 255, 30))
    fr.d.rounded_rectangle([(mx + mw - 330) * S, (fy + 12) * S, (mx + mw - 196) * S, (fy + 44) * S], 11 * S, outline=(120, 140, 255, 50), width=S)
    fr.text(mx + mw - 305, fy + 19, "Dismiss", f("d", 11.5), DIM)
    fr.hgrad(mx + mw - 184, fy + 12, 162, 32, 11)
    fr.text(mx + mw - 170, fy + 19, "Apply fix & retry", f("dm", 11.5), (255, 255, 255))


# ════════════════════════════════════════════════════════════════
def screen01():
    fr = Frame()
    topbar(fr, deploy_on=False)
    palette(fr)
    canvas(fr)
    copilot_idle(fr)
    fr.save("01-mission-control-canvas")


def screen02():
    fr = Frame()
    topbar(fr)
    palette(fr)
    canvas(fr)
    copilot_full(fr)
    fr.save("02-gemini-reasoning-2m-context")


def screen03():
    fr = Frame()
    topbar(fr)
    palette(fr)
    canvas(fr)
    compliance_panel(fr)
    fr.save("03-compliance-audit")


def screen04():
    fr = Frame()
    topbar(fr)
    palette(fr)
    canvas(fr)
    iac_panel(fr)
    fr.save("04-generated-terraform")


def screen05():
    fr = Frame()
    topbar(fr)
    palette(fr)
    canvas(fr, with_deck=True)
    flight_deck(fr, failed_at=None)
    copilot_full(fr)
    fr.save("05-flight-deck-orbit")


def screen06():
    fr = Frame()
    topbar(fr, chaos=True)
    palette(fr)
    canvas(fr, with_deck=True)
    flight_deck(fr, failed_at=4)
    copilot_full(fr)
    diagnosis_modal(fr)
    fr.save("06-gemini-diagnosis")


if __name__ == "__main__":
    for fn in (screen01, screen02, screen03, screen04, screen05, screen06):
        fn()
    print("done")
 