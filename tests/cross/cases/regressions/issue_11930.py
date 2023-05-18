# https://github.com/bokeh/bokeh/issues/11930

# Bokeh imports
from bokeh.core.properties import field
from bokeh.models import (
    Circle,
    ColumnDataSource,
    FixedTicker,
    GlyphRenderer,
    LinearAxis,
    Plot,
)

x = [1, 2, 3]
y = [4, 4.5, 6]

data_source = ColumnDataSource(data=dict(x=x, y=y))
glyph = Circle(x=field("x"), y=field("y"), size=10)
glyph_renderer = GlyphRenderer(glyph=glyph, data_source=data_source)

plot = Plot(width=200, height=200, renderers=[glyph_renderer])

int_overrides = {1: "A", 3: "C"}
float_overrides = {1.0: "A", 3.0: "C"}

int_axis = LinearAxis(axis_label="int overrides", major_label_overrides=int_overrides, ticker=FixedTicker(ticks=x))
float_axis = LinearAxis(axis_label="float overrides", major_label_overrides=float_overrides, ticker=FixedTicker(ticks=x))
plot.add_layout(int_axis, "below")
plot.add_layout(float_axis, "below")

output = plot
