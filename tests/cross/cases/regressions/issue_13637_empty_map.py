# https://github.com/bokeh/bokeh/issues/13637

# Bokeh imports
from bokeh.core.properties import value
from bokeh.models import (
    ColumnDataSource,
    GlyphRenderer,
    MultiLine,
    Plot,
    Rect,
    Selection,
)
from bokeh.settings import settings

# This is required for testing of multiline_indices, which otherwise
# would be skipped given the set value is equal to the default value.
settings.serialize_include_defaults.set_value(True)

plot = Plot(
    renderers=[
        GlyphRenderer(
            glyph=Rect(x=0, y=0, width=1, height=1),
            data_source=ColumnDataSource(),
        ),
        GlyphRenderer(
            glyph=MultiLine(xs=value([1, 2, 3]), ys=value([1, 2, 3])),
            data_source=ColumnDataSource(selected=Selection(multiline_indices={})),
        ),
    ],
)

output = plot
