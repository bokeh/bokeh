from bokeh.io import save
from bokeh.models import ColumnDataSource, LogAxis, LogScale, Plot, Range1d, Rect

plot = Plot(
    height=400, width=400,
    x_range=Range1d(0, 30), y_range=Range1d(1, 100),
    y_scale=LogScale(),
)

[x0, x1] = [10, 20]
[y0, y1] = [10, 20]

source = ColumnDataSource(data=dict(x=[(x0 + x1)/2], y=[(y0 + y1)/2], width=[x1 - x0], height=[y1 - y0]))
plot.add_glyph(source, Rect(x='x', y='y', width='width', height='height'))

plot.add_layout(LogAxis(), "left")

save(plot)
