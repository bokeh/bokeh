from typing import Literal

from bokeh.io import show
from bokeh.plotting import figure

p = figure(
    x_range=(5, 85), y_range=(0, 50),
    width=1000, height=400,
    x_axis_type=None, y_axis_type=None,
    toolbar_location=None,
    background_fill_color="ivory",
)

x = [10, 20, 30, 40, 50, 60, 70, 80, 90]
padding = 5

p.text(
    anchor="center",
    x=x,
    y=5,
    text=["none", "circle", "square", "ellipse", "box\nrectangle", "trapezoid", "parallelogram", "diamond", "triangle"],
    outline_shape=["none", "circle", "square", "ellipse", "box", "trapezoid", "parallelogram", "diamond", "triangle"],
    background_fill_color="white",
    background_fill_alpha=1.0,
    padding=padding,
    border_line_color="black",
    text_font_size="1.2em",
)

def tex(display: Literal["inline", "block"], y: float, color: str):
    p.tex(
        anchor="center",
        x=x,
        y=y,
        text=[
            r"\emptyset",
            r"x^{y^z}",
            r"\frac{1}{x^2\cdot y}",
            r"\int_{-\infty}^{\infty} \frac{1}{x} dx",
            r"F = G \left( \frac{m_1 m_2}{r^2} \right)",
            r"\delta",
            r"\sqrt[3]{\gamma}",
            r"x^2",
            r"y_{\rho \theta}",
        ],
        outline_shape=["none", "circle", "square", "ellipse", "box", "trapezoid", "parallelogram", "diamond", "triangle"],
        background_fill_color=color,
        background_fill_alpha=0.8,
        padding=padding,
        border_line_color="black",
        display=display,
    )

tex("inline", 20, "yellow")
tex("block", 40, "pink")

show(p)
