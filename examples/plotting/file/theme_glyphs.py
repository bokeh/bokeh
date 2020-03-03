from bokeh.models import (
    ColumnDataSource,
    Title,
    Ellipse,
    HBar,
    Text,
    Plot,
    LinearAxis,
    DataRange1d,
    Scatter,
    Line,
)
from bokeh.models.tickers import BasicTicker
from bokeh.models.formatters import BasicTickFormatter
from bokeh.transform import dodge
from bokeh.themes import Theme
from bokeh.io import output_file, show, curdoc
import numpy as np



theme_json = {
    "attrs": {
        "Plot": {"width": 400, "height": 400, "background_fill_color": "#eeeeee"},
        "Grid": {"visible": False},
        "Title": {"text": "Demo of Themes"},
        "LinearAxis": {
            "axis_line_color": "#ffffff",
            "major_tick_line_color": "#ffffff",
            "axis_label_text_font_size": "10pt",
            "axis_label_text_font_style": "bold",
        },
        "LineGlyph": {"line_color": "#ee33ee", "line_width": 2},
        "FillGlyph": {"fill_color": "orange"},
        "HatchGlyph": {"hatch_pattern": "@", "hatch_alpha": 0.8},
        "TextGlyph": {
            "text_color": "red",
            "text_font_style": "bold",
            "text_font": "Helvetica",
        },
        "Ellipse": {"fill_color": "green", "line_color": "yellow", "fill_alpha": 0.2},
    }
}


x = np.linspace(1, 5, 100)
y = x + np.sin((x - 1) * np.pi)
x2 = np.linspace(1.5, 5.5, 5)
z = x2 + 2 * np.cos((x2 - 1) * np.pi)
source = ColumnDataSource(
    {"x": [1, 2, 3, 4, 5], "y": [1, 2, 3, 4, 5], "who": ["a", "b", "c", "d", "e"]}
)
source2 = ColumnDataSource({"x": x, "y": y})
source3 = ColumnDataSource({"x": x2, "y": z})


plot = Plot(
    plot_width=300, plot_height=300, x_range=DataRange1d(), y_range=DataRange1d()
)
plot.title = Title()
xaxis = LinearAxis(ticker=BasicTicker(), formatter=BasicTickFormatter())
yaxis = LinearAxis(ticker=BasicTicker(), formatter=BasicTickFormatter())
plot.add_layout(xaxis, "below")
plot.add_layout(yaxis, "left")

plot.add_glyph(source, Scatter(x="x", y="y", marker="diamond", size=20))
plot.add_glyph(source, Text(x=dodge("x", -0.2), y=dodge("y", 0.1), text="who"))
plot.add_glyph(source2, Line(x="x", y="y"))
plot.add_glyph(source3, Ellipse(x="x", y="y", width=0.2, height=0.3, angle=-0.7))
plot.add_glyph(
    ColumnDataSource({"y": [2.5], "x": [0.5]}), glyph=HBar(y="y", right="x", height=1.5)
)
curdoc().theme = Theme(json=theme_json)

output_file("theme_glyphs.html", title="themed_glyphs.py example")
show(plot)
