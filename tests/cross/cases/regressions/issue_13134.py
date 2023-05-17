# https://github.com/bokeh/bokeh/issues/13134

# External imports
import numpy as np

# Bokeh imports
from bokeh.core.properties import field
from bokeh.models import (
    CDSView,
    Circle,
    ColumnDataSource,
    GlyphRenderer,
    IndexFilter,
    Plot,
)

data_source = ColumnDataSource(data=dict(x=np.array([1, 2, 3, 4, 5]), y=np.array([1, 2, 3, 4, 5])))
view = CDSView(filter=IndexFilter(indices=np.array([0, 2, 4])))
glyph = Circle(x=field("x"), y=field("y"), size=10)
glyph_renderer = GlyphRenderer(glyph=glyph, data_source=data_source, view=view)
plot = Plot(renderers=[glyph_renderer])
output = plot
