""" Renderers for various kinds of annotations that can be added to
Bokeh plots

"""
from __future__ import absolute_import

from ..core.enums import LegendLocation, SpatialUnits, RenderLevel, Dimension, RenderMode, Side
from ..core.property_mixins import LineProps, FillProps, TextProps
from ..core.properties import abstract
from ..core.properties import (
    Bool, Int, String, Enum, Instance, List, Dict, Tuple,
    Include, NumberSpec, Either, Auto, Float, Override, Seq
)
from ..util.deprecate import deprecated
from .renderers import Renderer, GlyphRenderer

@abstract
class Annotation(Renderer):
    """ Base class for annotation models.

    """

    plot = Instance(".models.plots.Plot", help="""
    The plot to which this annotation is attached.
    """)

    level = Enum(RenderLevel, default="annotation", help="""
    Specifies the level in which to render the annotation.
    """)

class Legend(Annotation):
    """ Render informational legends for a plot.

    """

    __deprecated_attributes__ = ('orientation',)

    @property
    @deprecated("Bokeh 0.11", "Legend.location")
    def orientation(self):
        return self.location

    @orientation.setter
    @deprecated("Bokeh 0.11", "Legend.location")
    def orientation(self, location):
        self.location = location

    location = Either(Enum(LegendLocation), Tuple(Float, Float),
        default="top_right", help="""
    The location where the legend should draw itself. It's either one of
    ``bokeh.core.enums.LegendLocation``'s enumerated values, or a ``(x, y)``
    tuple indicating an absolute location absolute location in screen
    coordinates (pixels from the bottom-left corner).
    """)

    border_props = Include(LineProps, help="""
    The %s for the legend border outline.
    """)

    background_props = Include(FillProps, help="""
    The %s for the legend background style.
    """)

    background_fill_color = Override(default="#ffffff")

    label_props = Include(TextProps, help="""
    The %s for the legend labels.
    """)

    label_text_baseline = Override(default='middle')

    label_text_font_size = Override(default={ 'value' : '10pt' })

    label_standoff = Int(15, help="""
    The distance (in pixels) to separate the label from its associated glyph.
    """)

    label_height = Int(20, help="""
    The height (in pixels) of the area that legend labels should occupy.
    """)

    label_width = Int(50, help="""
    The width (in pixels) of the area that legend labels should occupy.
    """)

    glyph_height = Int(20, help="""
    The height (in pixels) that the rendered legend glyph should occupy.
    """)

    glyph_width = Int(20, help="""
    The width (in pixels) that the rendered legend glyph should occupy.
    """)

    legend_padding = Int(10, help="""
    Amount of padding around the legend.
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

class BoxAnnotation(Annotation):
    """ Render a shaded rectangular region as an annotation.

    """

    left = Either(Auto, NumberSpec(), default=None, help="""
    The x-coordinates of the left edge of the box annotation.
    """)

    left_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the left attribute. Interpreted as "data space" units
    by default.
    """)

    right = Either(Auto, NumberSpec(), default=None, help="""
    The x-coordinates of the right edge of the box annotation.
    """)

    right_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the right attribute. Interpreted as "data space" units
    by default.
    """)

    bottom = Either(Auto, NumberSpec(), default=None, help="""
    The y-coordinates of the bottom edge of the box annotation.
    """)

    bottom_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the bottom attribute. Interpreted as "data space" units
    by default.
    """)

    top = Either(Auto, NumberSpec(), default=None, help="""
    The y-coordinates of the top edge of the box annotation.
    """)

    top_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the top attribute. Interpreted as "data space" units
    by default.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering box annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering box annotations on the plot. If unset, use the default y-range.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the box.
    """)

    line_alpha = Override(default=0.3)

    line_color = Override(default="#cccccc")

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the box.
    """)

    fill_alpha = Override(default=0.4)

    fill_color = Override(default="#fff9ba")

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the box is rendered as a canvas element or as an
    css element overlaid on the canvas. The default mode is "canvas".

    .. warning::
        The line_dash and line_dash_offset attributes aren't supported if
        the render_mode is set to "css"

    """)

class PolyAnnotation(Annotation):
    """ Render a shaded polygonal region as an annotation.

    """

    xs = Seq(Float, default=[], help="""
    The x-coordinates of the region to draw.
    """)

    xs_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the xs attribute. Interpreted as "data space" units
    by default.
    """)

    ys = Seq(Float, default=[], help="""
    The y-coordinates of the region to draw.
    """)

    ys_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the ys attribute. Interpreted as "data space" units
    by default.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering box annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering box annotations on the plot. If unset, use the default y-range.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the polygon.
    """)

    line_alpha = Override(default=0.3)

    line_color = Override(default="#cccccc")

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the polygon.
    """)

    fill_alpha = Override(default=0.4)

    fill_color = Override(default="#fff9ba")

class Span(Annotation):
    """ Render a horizontal or vertical line span.

    """

    location = Float(help="""
    The location of the span, along ``dimension``.
    """)

    location_units = Enum(SpatialUnits, default='data', help="""
    The unit type for the location attribute. Interpreted as "data space"
    units by default.
    """)

    dimension = Enum(Dimension, default='width', help="""
    The direction of the span.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering annotations on the plot. If unset, use the default y-range.
    """)

    render_mode = Enum(RenderMode, default="canvas", help="""
    Specifies whether the span is rendered as a canvas element or as an
    css element overlaid on the canvas. The default mode is "canvas".

    .. warning::
        The line_dash and line_dash_offset attributes aren't supported if
        the render_mode is set to "css"

    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the span.
    """)

class Tooltip(Annotation):
    """ Render a tooltip.

    .. note::
        This model is currently managed by BokehJS and is not useful
        directly from python.

    """
    level = Override(default="overlay")

    side = Either(Auto, Enum(Side), default="auto", help="""
    Whether the tooltip should display to the left or right off the cursor
    position, or if it should be automatically placed.
    """)

    inner_only = Bool(default=True, help="""
    Whether to display outside a central plot frame area.
    """)