"""Exercise atlas-backed WebGL rendering for Text, TeX, and MathML glyphs."""

import numpy as np

from bokeh.layouts import column, row
from bokeh.models import Div
from bokeh.palettes import Turbo256
from bokeh.plotting import figure, show

rng = np.random.default_rng(2026)


def make_plot(title):
    plot = figure(
        width=620, height=520, title=title,
        x_range=(-10, 10), y_range=(-10, 10),
        output_backend="webgl", tools="pan,wheel_zoom,reset,save", active_scroll="wheel_zoom",
    )
    plot.background_fill_color = "#07111f"
    plot.border_fill_color = "#020617"
    plot.outline_line_color = "#334155"
    plot.grid.grid_line_color = "#334155"
    plot.grid.grid_line_alpha = 0.3
    plot.axis.major_label_text_color = "#cbd5e1"
    plot.title.text_color = "#f8fafc"
    return plot


N_TEXT = 2_500
N_BADGE = 180
N_TEX = 24
N_MATHML = 18

plain = make_plot(f"Text atlas · {N_TEXT + N_BADGE:,} labels")
x = rng.uniform(-9.5, 9.5, N_TEXT)
y = rng.uniform(-9.5, 9.5, N_TEXT)
words = np.array(["GPU", "atlas", "pan", "zoom", "Bokeh", "WebGL"])
plain.text(
    x=x, y=y, text=words[np.arange(N_TEXT) % len(words)],
    angle=rng.uniform(-np.pi, np.pi, N_TEXT), anchor="center",
    text_color=[Turbo256[i] for i in rng.integers(20, 235, N_TEXT)],
    text_alpha=0.72, text_font_size="9px",
)

badge_x = np.linspace(-8.5, 8.5, 18)
badge_y = np.linspace(-8.5, 8.5, 10)
badge_x, badge_y = np.meshgrid(badge_x, badge_y)
shapes = np.array(["box", "circle", "square", "ellipse", "diamond", "triangle"])
plain.text(
    x=badge_x.ravel(), y=badge_y.ravel(), text=[f"{i:03d}" for i in range(N_BADGE)],
    anchor="center", outline_shape=shapes[np.arange(N_BADGE) % len(shapes)],
    text_color="#f8fafc", text_font_size="10px", padding=4,
    background_fill_color="#0f172a", background_fill_alpha=0.88,
    border_line_color="#38bdf8", border_line_alpha=0.75,
)


math = make_plot(f"TeX + MathML atlas · {N_TEX + N_MATHML:,} formulas")
tex_formulas = [
    r"\frac{1}{x^2}",
    r"\int_0^\infty e^{-x}\,dx",
    r"e^{i\pi}+1=0",
    r"\sum_{n=1}^{\infty}\frac{1}{n^2}",
    r"\sqrt{a^2+b^2}",
    r"\nabla\cdot\vec{E}=\frac{\rho}{\epsilon_0}",
]
theta = np.linspace(0, 2*np.pi, N_TEX, endpoint=False)
math.tex(
    x=7.3*np.cos(theta), y=7.3*np.sin(theta),
    text=[tex_formulas[i % len(tex_formulas)] for i in range(N_TEX)],
    angle=theta + np.pi/2, anchor="center", display="inline",
    text_color="#7dd3fc", text_font_size="16px", padding=4,
    background_fill_color="#0f172a", background_fill_alpha=0.78,
    border_line_color="#0369a1", border_line_alpha=0.8,
)

mathml_formulas = [
    "<math><mfrac><mn>1</mn><mi>x</mi></mfrac></math>",
    "<math><msup><mi>x</mi><mn>2</mn></msup></math>",
    "<math><msqrt><mrow><msup><mi>a</mi><mn>2</mn></msup><mo>+</mo><msup><mi>b</mi><mn>2</mn></msup></mrow></msqrt></math>",
]
mx = np.linspace(-6, 6, 6)
my = np.linspace(-4.5, 4.5, 3)
mx, my = np.meshgrid(mx, my)
math.mathml(
    x=mx.ravel(), y=my.ravel(),
    text=[mathml_formulas[i % len(mathml_formulas)] for i in range(N_MATHML)],
    anchor="center", text_color="#a7f3d0", text_font_size="18px",
)

header = Div(text=f"""
<h2 style="margin: 0 0 8px; color: #f8fafc;">WebGL text and math texture atlases</h2>
<p style="margin: 0; color: #cbd5e1; line-height: 1.5;">
These plots contain <strong>{N_TEXT + N_BADGE + N_TEX + N_MATHML:,}</strong> labels.
Canvas and MathJax rasterize each label once into retained high-DPI atlas pages;
WebGL then renders each page with instanced quads. Pan and zoom update only compact
screen-space bounds, without rebuilding the label textures.
</p>
""", width=1240)

show(column(header, row(plain, math)))
