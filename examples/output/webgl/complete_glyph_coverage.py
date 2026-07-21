"""Show every WebGL glyph that previously required a Canvas fallback."""

from urllib.parse import quote

import numpy as np

from bokeh.layouts import column, gridplot
from bokeh.models import Div
from bokeh.palettes import Turbo256
from bokeh.plotting import figure, show

TOOLS = "pan,wheel_zoom,reset,save"
rng = np.random.default_rng(2026)


def make_plot(title, x_range=(-10, 10), y_range=(-10, 10)):
    plot = figure(
        width=620, height=440, title=title,
        x_range=x_range, y_range=y_range,
        output_backend="webgl", tools=TOOLS, active_scroll="wheel_zoom",
    )
    plot.background_fill_color = "#07111f"
    plot.border_fill_color = "#020617"
    plot.outline_line_color = "#334155"
    plot.grid.grid_line_color = "#334155"
    plot.grid.grid_line_alpha = 0.35
    plot.axis.axis_line_color = "#64748b"
    plot.axis.major_tick_line_color = "#64748b"
    plot.axis.major_label_text_color = "#cbd5e1"
    plot.title.text_color = "#f8fafc"
    return plot


# Seven line-oriented glyphs share the adaptive WebGL path renderer. Curves
# are flattened to a subpixel screen-space tolerance and rebuilt on zoom.
N_SEGMENT = 2_000
N_ARC = 300
N_RAY = 250
N_QUADRATIC = 125
N_BEZIER = 125

curves = make_plot(
    f"Adaptive paths · {N_SEGMENT + N_ARC + N_RAY + N_QUADRATIC + N_BEZIER:,} source rows",
)

x0 = rng.uniform(-10, 10, N_SEGMENT)
y0 = rng.uniform(-10, 10, N_SEGMENT)
phase = 0.7*x0 - 0.4*y0
curves.segment(
    x0=x0, y0=y0,
    x1=x0 + 0.22*np.cos(phase), y1=y0 + 0.22*np.sin(phase),
    line_color="#164e63", line_alpha=0.28,
)

theta = np.linspace(0, 18*np.pi, N_ARC)
radius = np.linspace(0.08, 9.2, N_ARC)
curves.arc(
    x=radius*np.cos(theta), y=radius*np.sin(theta), radius=0.18,
    start_angle=theta, end_angle=theta + 1.7*np.pi,
    line_color="#38bdf8", line_alpha=0.55, line_width=1.2,
)

ray_angle = rng.uniform(0, 2*np.pi, N_RAY)
ray_radius = rng.uniform(0.3, 9.5, N_RAY)
curves.ray(
    x=ray_radius*np.cos(ray_angle), y=ray_radius*np.sin(ray_angle),
    length=0.55, angle=ray_angle + np.pi/2,
    line_color="#a78bfa", line_alpha=0.32,
)

qy = np.linspace(-8.5, 8.5, N_QUADRATIC)
curves.quadratic(
    x0=-9, y0=qy, x1=-5.5, y1=qy,
    cx=-7.25 + 0.45*np.sin(3*qy), cy=qy + 0.65*np.cos(qy),
    line_color="#fbbf24", line_alpha=0.22,
)

by = np.linspace(-8.5, 8.5, N_BEZIER)
curves.bezier(
    x0=5.5, y0=by, x1=9, y1=by,
    cx0=6.1, cy0=by + 0.9*np.sin(2*by),
    cx1=8.4, cy1=by - 0.9*np.cos(2*by),
    line_color="#fb7185", line_alpha=0.22,
)

# Each area is a single large polygon. NaN-separated finite runs and step
# expansion are triangulated by the shared polygon pipeline.
N_AREA = 20_000
t = np.linspace(-9.5, 9.5, N_AREA)
areas = make_plot(f"Area family · {4*N_AREA:,} source rows")
areas.varea(
    x=t, y1=4.9 + 0.45*np.sin(1.7*t), y2=7.3 + 0.65*np.sin(0.9*t + 0.5),
    fill_color="#38bdf8", fill_alpha=0.45,
)
areas.varea_step(
    x=t, y1=0.4 + 0.35*np.cos(2.1*t), y2=3.0 + 0.55*np.sin(1.1*t),
    step_mode="center", fill_color="#a78bfa", fill_alpha=0.45,
)
areas.harea(
    y=t, x1=-7.6 + 0.45*np.cos(1.6*t), x2=-5.0 + 0.6*np.sin(0.8*t),
    fill_color="#34d399", fill_alpha=0.42,
)
areas.harea_step(
    y=t, x1=-3.8 + 0.35*np.sin(2.0*t), x2=-1.1 + 0.55*np.cos(t),
    step_mode="after", fill_color="#f59e0b", fill_alpha=0.45,
)


# Ellipses reuse the vector polygon renderer. MultiPolygons exercises nested
# holes, per-row visuals, selection-ready batching, and anti-aliased skirts.
N_ELLIPSE = 8_000
# Keep the outlined polygons sparse enough that their overlapping boundaries
# remain visually distinguishable at every zoom level. The ellipses retain the
# high glyph count used to stress adaptive synthetic-patch remapping.
N_MULTIPOLYGON = 120
polygons = make_plot(f"Ellipse + MultiPolygons · {N_ELLIPSE + N_MULTIPOLYGON:,} glyphs")

ex = rng.uniform(-10, 10, N_ELLIPSE)
ey = rng.uniform(-10, 10, N_ELLIPSE)
colors = [Turbo256[index] for index in rng.integers(20, 235, N_ELLIPSE)]
polygons.ellipse(
    x=ex, y=ey,
    width=rng.uniform(0.08, 0.38, N_ELLIPSE),
    height=rng.uniform(0.04, 0.22, N_ELLIPSE),
    angle=rng.uniform(0, np.pi, N_ELLIPSE),
    fill_color=colors, fill_alpha=0.42, line_alpha=0,
)

mp_xs = []
mp_ys = []
mp_colors = []
for i in range(N_MULTIPOLYGON):
    angle = 2*np.pi*i/N_MULTIPOLYGON
    center_r = 4.2 + 3.8*np.sin(7*angle)**2
    cx = center_r*np.cos(angle)
    cy = center_r*np.sin(angle)
    outer_angle = np.linspace(0, 2*np.pi, 11) + angle
    outer_r = np.where(np.arange(11) % 2 == 0, 0.34, 0.16)
    inner_angle = np.linspace(0, 2*np.pi, 7) - angle
    outer_x = (cx + outer_r*np.cos(outer_angle)).tolist()
    outer_y = (cy + outer_r*np.sin(outer_angle)).tolist()
    inner_x = (cx + 0.06*np.cos(inner_angle)).tolist()
    inner_y = (cy + 0.06*np.sin(inner_angle)).tolist()
    mp_xs.append([[outer_x, inner_x]])
    mp_ys.append([[outer_y, inner_y]])
    mp_colors.append(Turbo256[(5*i) % 256])

polygons.multi_polygons(
    xs=mp_xs, ys=mp_ys,
    fill_color=mp_colors, fill_alpha=0.78,
    line_color="#e0f2fe", line_alpha=0.85, line_width=1.2,
)


# Full-frame spans are regenerated from the current frame on every range
# change. ImageURL uploads loaded browser images as textures and supports
# anchors, alpha, rotation, selection, and Canvas fallback for CORS failures.
N_HSPAN = 500
N_VSPAN = 500
N_IMAGE = 12
media = make_plot(f"Spans + ImageURL · {N_HSPAN + N_VSPAN + N_IMAGE:,} glyphs")

h = np.linspace(-9.5, 9.5, N_HSPAN)
v = np.linspace(-9.5, 9.5, N_VSPAN)
media.hspan(
    y=h, line_color="#0ea5e9", line_alpha=0.055,
    line_width=1 + (np.arange(N_HSPAN) % 5 == 0),
)
media.vspan(
    x=v, line_color="#f97316", line_alpha=0.055,
    line_width=1 + (np.arange(N_VSPAN) % 5 == 0),
)

badge_svg = """
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#38bdf8"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
  <rect x="4" y="4" width="88" height="88" rx="24" fill="url(#g)" stroke="#e0f2fe" stroke-width="6"/>
  <path d="M24 63 40 32l13 23 8-14 13 22Z" fill="#f8fafc"/>
</svg>
"""
badge_url = "data:image/svg+xml;charset=utf-8," + quote(badge_svg)
image_angle = np.linspace(0, 2*np.pi, N_IMAGE, endpoint=False)
media.image_url(
    url=[badge_url]*N_IMAGE,
    x=6.8*np.cos(image_angle), y=6.8*np.sin(image_angle),
    w=1.45, h=1.45, anchor="center",
    angle=image_angle + np.pi/8, global_alpha=np.linspace(0.35, 1.0, N_IMAGE),
)


header = Div(text=f"""
<h2 style="margin: 0 0 8px; color: #f8fafc;">New non-text WebGL glyph coverage</h2>
<p style="margin: 0; color: #cbd5e1; line-height: 1.5;">
These four plots exercise all 14 Python-exposed glyphs that previously fell back to Canvas:
Arc, Bezier, Ellipse, Quadratic, Ray, Segment, HArea, HAreaStep, VArea,
VAreaStep, MultiPolygons, HSpan, VSpan, and ImageURL. Together they contain
<strong>{N_SEGMENT + N_ARC + N_RAY + N_QUADRATIC + N_BEZIER + 4*N_AREA + N_ELLIPSE + N_MULTIPOLYGON + N_HSPAN + N_VSPAN + N_IMAGE:,}</strong>
source rows/glyphs. Pan, wheel-zoom, and reset repeatedly to exercise remapping,
adaptive tessellation, texture reuse, and retained polygon topology.
The BokehJS-only Spline glyph is covered separately by the browser integration test.
</p>
""", width=1240)

show(column(header, gridplot([[curves, areas], [polygons, media]], toolbar_location="above")))
