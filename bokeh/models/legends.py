""" Renderers for various kinds of legends that can be added to
Bokeh plots

"""
from __future__ import absolute_import

from ..core.enums import Orientation, LegendLocation
from ..core.property_mixins import LineProps, FillProps, TextProps
from ..core.properties import (
    Int, String, Enum, Instance, List, Dict, Tuple, Include, Either,
    Float, Override,
)

from .formatters import TickFormatter, BasicTickFormatter
from .mappers import ColorMapper
from .renderers import GuideRenderer, GlyphRenderer
from .tickers import Ticker, BasicTicker

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

class ColorBar(GuideRenderer):
    """ Render a colobar based on a color mapper for a plot.

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

    title = String(help="""
    The text value to render.
    """)

    title_text_props = Include(TextProps, help="""
    The %s values for the text.
    """)

    legend_height = Int(400, help="""
    The height (in pixels) that the rendered legend glyph should occupy.
    """)

    legend_width = Int(50, help="""
    The width (in pixels) that the rendered legend glyph should occupy.
    """)

    ticker = Instance(Ticker, default=lambda: BasicTicker(), help="""
    A Ticker to use for computing locations of axis components.
    """)

    formatter = Instance(TickFormatter, default=lambda: BasicTickFormatter(), help="""
    A TickFormatter to use for formatting the visual appearance
    of ticks.
    """)

    color_mapper = Instance(ColorMapper, help="""
    A color mapper containing a color palette to render.
    """)

    legend_margin = Int(30, help="""
    Amount of margin around the legend.
    """)

    legend_padding = Int(10, help="""
    Amount of padding around the contents of the legend.
    """)

    # legend_spacing = Int(3, help="""
    # Amount of spacing between legend entries.
    # """)

    label_standoff = Int(5, help="""
    The distance (in pixels) to separate the label from its associated glyph.
    """)

    major_label_props = Include(TextProps, help="""
    The %s of the major tick labels.
    """)

    major_label_text_align = Override(default="center")

    major_label_text_baseline = Override(default="middle")

    major_label_text_font_size = Override(default={'value': "8pt"})

    major_tick_props = Include(LineProps, help="""
    The %s of the major ticks.
    """)

    major_tick_in = Int(default=2, help="""
    The distance in pixels that major ticks should extend into the
    main plot area.
    """)

    major_tick_out = Int(default=6, help="""
    The distance in pixels that major ticks should extend out of the
    main plot area.
    """)

    minor_tick_props = Include(LineProps, help="""
    The %s of the minor ticks.
    """)

    minor_tick_in = Int(default=0, help="""
    The distance in pixels that minor ticks should extend into the
    main plot area.
    """)

    minor_tick_out = Int(default=4, help="""
    The distance in pixels that major ticks should extend out of the
    main plot area.
    """)

    border_props = Include(LineProps, help="""
    The %s for the colorbar border outline.
    """)

    background_props = Include(FillProps, help="""
    The %s for the colorbar background style.
    """)

    background_fill_color = Override(default="#ffffff")

    background_fill_alpha = Override(default=0.95)
