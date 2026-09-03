from math import pi

from bokeh.core.properties import expr
from bokeh.layouts import column
from bokeh.models import AdaptiveTicker, ColumnDataSource, CustomJSExpr, ScaledTicker, ScaledTickFormatter
from bokeh.plotting import figure, show

def make_plot(multiple: int, title: str):
    bound = multiple*pi
    source = ColumnDataSource(data=dict(t=[i/400 for i in range(401)]))

    p = figure(
        width=650,
        height=250,
        x_range=(-bound, bound),
        y_range=(-1.1, 1.1),
        tools="xpan,xwheel_zoom,reset,save",
        title=title,
    )
    x = CustomJSExpr(args=dict(x_range=p.x_range), code="""
        const {start, end} = x_range
        return this.data.t.map((t) => start + t*(end - start))
    """)
    y = CustomJSExpr(args=dict(x_range=p.x_range), code="""
        const {start, end} = x_range
        return this.data.t.map((t) => Math.sin(start + t*(end - start)))
    """)
    p.line(x=expr(x), y=expr(y), source=source, line_width=2)

    p.xaxis[0].ticker = ScaledTicker(
        scale=pi,
        ticker=AdaptiveTicker(base=2, mantissas=[1]),
        desired_num_ticks=9,
    )
    p.xaxis[0].formatter = ScaledTickFormatter(
        suffix=r"$$\pi$$",
        unit_style="symbolic",
        use_fractions=True,
        fraction_style="inline",
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
