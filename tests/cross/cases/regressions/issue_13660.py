# https://github.com/bokeh/bokeh/issues/13660

# External imports
import numpy as np

# Bokeh imports
from bokeh.models import (
    BooleanFilter,
    ColumnDataSource,
    DataView,
    GlyphRenderer,
    Plot,
    Scatter,
)

x = np.array([1, 2, 3, 4, 5])
y = np.array([1, 2, 3, 4, 5])

data_source = ColumnDataSource(data=dict(x=x, y=y))
view = DataView(filter=BooleanFilter(x % 2 == 0))
glyph = Scatter(size=10)
glyph_renderer = GlyphRenderer(glyph=glyph, data_source=data_source, view=view)
plot = Plot(renderers=[glyph_renderer])
output = plot
