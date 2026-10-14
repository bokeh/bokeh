from math import pi, sin

from bokeh.layouts import column
from bokeh.models import AdaptiveTicker, UnitTicker, UnitTickFormatter
from bokeh.plotting import figure, show

def make_plot(multiple: int, title: str):
    bound = multiple*pi
    x = [-bound + 2*bound*i/400 for i in range(401)]

    p = figure(
        width=650,
        height=250,
        x_range=(-bound, bound),
        y_range=(-1.1, 1.1),
        tools="",
        toolbar_location=None,
        title=title,
    )
    p.line(x, [sin(value) for value in x], line_width=2)

    p.xaxis[0].ticker = UnitTicker(
        scale=pi,
        ticker=AdaptiveTicker(base=2, mantissas=[1]),
        desired_num_ticks=9,
    )
    p.xaxis[0].formatter = UnitTickFormatter(
        suffix=r"$$\pi$$",
        unit_style="symbolic",
        use_fractions=True,
        max_denominator=8,
    )
    p.xaxis[0].axis_label = "x"
    p.xaxis[0].major_label_standoff = 8
    p.xaxis[0].major_label_text_font = "serif"
    p.xaxis[0].major_label_text_font_size = "13px"
    return p

show(column(
    make_plot(1, "Fractional multiples of π"),
    make_plot(8, "Larger multiples of π"),
))
