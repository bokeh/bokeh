from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import ColumnDataSource, Plot, Rect, Range1d, LogAxis

plot = Plot(plot_height=400, plot_width=400,
            x_range=Range1d(0, 30), y_range=Range1d(1, 100))

[x0, x1] = [10, 20]
[y0, y1] = [10, 20]

source = ColumnDataSource(data=dict(x=[(x0 + x1)/2], y=[(y0 + y1)/2], width=[x1 - x0], height=[y1 - y0]))
plot.add_glyph(source, Rect(x='x', y='y', width='width', height='height'))

plot.add_layout(LogAxis(), "left")

save(plot)
