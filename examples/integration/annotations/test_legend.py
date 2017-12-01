from __future__ import absolute_import

from bokeh.io import save
from bokeh.core.properties import field
from bokeh.models import ColumnDataSource, Plot, Circle, Legend, LegendItem, Range1d

plot = Plot(
    width=600, height=600,
    x_range=Range1d(0, 4), y_range=Range1d(0, 4),
    toolbar_location=None,
)
source = ColumnDataSource(dict(
    x=[1, 2, 3],
    y=[1, 2, 3],
    color=['red', 'green', 'blue'],
    label=['Color Red', 'Color Green', 'Color Blue'],
))
circle = Circle(x='x', y='y', fill_color='color', size=20)
circle_renderer = plot.add_glyph(source, circle)
plot.add_layout(Legend(items=[LegendItem(label=field('label'), renderers=[circle_renderer])]))

save(plot)
