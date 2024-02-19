# https://github.com/bokeh/bokeh/issues/13637

# Standard library imports
from types import SimpleNamespace
from typing import NamedTuple, TypedDict

# External imports
from typing_extensions import NotRequired

# Bokeh imports
from bokeh.core.property.struct import struct
from bokeh.models import (
    ColumnDataSource,
    GlyphRenderer,
    Plot,
    Rect,
)
from bokeh.palettes import Spectral7


class BorderRadiusTD(TypedDict):
    top_left: NotRequired[int]
    top_right: NotRequired[int]
    bottom_right: NotRequired[int]
    bottom_left: NotRequired[int]

class BorderRadiusNT(NamedTuple):
    top_left: int = 0
    top_right: int = 0
    bottom_right: int = 0
    bottom_left: int = 0

rect0 = Rect(x=0, y=0, width=1, height=1, fill_color=Spectral7[0], border_radius=30)
rect1 = Rect(x=1, y=1, width=1, height=1, fill_color=Spectral7[1], border_radius=dict(top_left=30, top_right=20, bottom_right=10))
rect2 = Rect(x=2, y=2, width=1, height=1, fill_color=Spectral7[2], border_radius=SimpleNamespace(top_left=30, top_right=20, bottom_right=10))
rect3 = Rect(x=3, y=3, width=1, height=1, fill_color=Spectral7[3], border_radius=struct(top_left=30, top_right=20, bottom_right=10))
rect4 = Rect(x=4, y=4, width=1, height=1, fill_color=Spectral7[4], border_radius=BorderRadiusTD(top_left=30, top_right=20, bottom_right=10))
rect5 = Rect(x=5, y=5, width=1, height=1, fill_color=Spectral7[5], border_radius=[30, 20, 10, 0])
rect6 = Rect(x=6, y=6, width=1, height=1, fill_color=Spectral7[6], border_radius=BorderRadiusNT(top_left=30, top_right=20, bottom_right=10))

plot = Plot(
    renderers=[
        GlyphRenderer(glyph=rect0, data_source=ColumnDataSource()),
        GlyphRenderer(glyph=rect1, data_source=ColumnDataSource()),
        GlyphRenderer(glyph=rect2, data_source=ColumnDataSource()),
        GlyphRenderer(glyph=rect3, data_source=ColumnDataSource()),
        GlyphRenderer(glyph=rect4, data_source=ColumnDataSource()),
        GlyphRenderer(glyph=rect5, data_source=ColumnDataSource()),
        GlyphRenderer(glyph=rect6, data_source=ColumnDataSource()),
    ],
)

output = plot
