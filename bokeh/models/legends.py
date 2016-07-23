""" Renderers for various kinds of guides that can be added to
Bokeh plots

"""
from __future__ import absolute_import

from ..core.enums import Orientation, LegendLocation
from ..core.property_mixins import LineProps, FillProps, TextProps
from ..core.properties import (
    Int, String, Enum, Instance, List, Dict, Tuple, Include, Either,
    Float, Override,
)

from .renderers import GuideRenderer, GlyphRenderer

class Legend(GuideRenderer):
    """ Render informational legends for a plot.

    """

    location = Either(Enum(LegendLocation), Tuple(Float, Float),
        default="top_right", help="""
    The location where the legend should draw itself. It's either one of
    ``bokeh.core.enums.LegendLocation``'s enumerated values, or a ``(x, y)``
    tuple indicating an absolute location absolute location in screen
    coordinates (pixels from the bottom-left corner).
    """)

    orientation = Enum(Orientation, default="vertical", help="""
    Whether the legend entries should be placed vertically or horizontally
    when they are layed out.
    """)

    border_props = Include(LineProps, help="""
    The %s for the legend border outline.
    """)

    border_line_color = Override(default="#e5e5e5")

    border_line_alpha = Override(default=0.5)

    background_props = Include(FillProps, help="""
    The %s for the legend background style.
    """)

    background_fill_color = Override(default="#ffffff")

    background_fill_alpha = Override(default=0.95)

    label_props = Include(TextProps, help="""
    The %s for the legend labels.
    """)

    label_text_baseline = Override(default='middle')

    label_text_font_size = Override(default={ 'value' : '10pt' })

    label_standoff = Int(5, help="""
    The distance (in pixels) to separate the label from its associated glyph.
    """)

    label_height = Int(20, help="""
    The minimum height (in pixels) of the area that legend labels should occupy.
    """)

    label_width = Int(20, help="""
    The minimum width (in pixels) of the area that legend labels should occupy.
    """)

    glyph_height = Int(20, help="""
    The height (in pixels) that the rendered legend glyph should occupy.
    """)

    glyph_width = Int(20, help="""
    The width (in pixels) that the rendered legend glyph should occupy.
    """)

    legend_margin = Int(10, help="""
    Amount of margin around the legend.
    """)

    legend_padding = Int(10, help="""
    Amount of padding around the contents of the legend.
    """)

    legend_spacing = Int(3, help="""
    Amount of spacing between legend entries.
    """)

    legends = List(Tuple(String, List(Instance(GlyphRenderer))), help="""
    A list of tuples that maps text labels to the legend to corresponding
    renderers that should draw sample representations for those labels.

    .. note::
        The ``legends`` attribute may also be set from a dict or OrderedDict.
        If a dict is used, the order of the legend entries is unspecified.

    """).accepts(
        Dict(String, List(Instance(GlyphRenderer))), lambda d: list(d.items())
    )
