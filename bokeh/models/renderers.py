""" Models (mostly base classes) for the various kinds of renderer
types that Bokeh supports.

"""
from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Int, String, Enum, Instance, List, Dict, Tuple, Include
from ..mixins import LineProps, TextProps
from ..enums import Units, Orientation

from .sources import DataSource
from .glyphs import Glyph

class Renderer(PlotObject):
    """ A base class for renderer types. ``Renderer`` is not
    generally useful to instantiate on its own.

    """

class GlyphRenderer(Renderer):
    """

    """

    data_source = Instance(DataSource, help="""
    Local data source to use when rendering glyphs on the plot.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen
    locations when rendering glyphs on the plot. If unset, use the
    default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen
    locations when rendering glyphs on the plot. If unset, use the
    default -range.
    """)

    # TODO: (bev) is this actually used?
    units = Enum(Units)

    glyph = Instance(Glyph, help="""
    The glyph to render, in conjunction with the supplied data source
    and ranges.
    """)

    selection_glyph = Instance(Glyph, help="""
    An optional glyph used for selected points.
    """)

    nonselection_glyph = Instance(Glyph, help="""
    An optional glyph used for explicitly non-selected points
    (i.e., non-selected when there are other points that are selected,
    but not when no points at all are selected.)
    """)

# TODO: (bev) This should really go in a separate module
class Legend(Renderer):
    """ Render informational legends for a plot.

    """

    plot = Instance(".models.plots.Plot", help="""
    The Plot to which this Legend is attached.
    """)

    orientation = Enum(Orientation, help="""
    The location where the legend should draw itself.
    """)

    border_props = Include(LineProps, help="""
    The %s for the legend border outline.
    """)

    label_props = Include(TextProps, help="""
    The %s for the legend labels.
    """)

    label_standoff = Int(15, help="""
    The distance in pixels
    """)

    label_height = Int(20, help="""
    The height in pixels that the area that legend labels should occupy.
    """)

    label_width = Int(50, help="""
    The width in pixels that the area that legend labels should occupy.
    """)

    glyph_height = Int(20, help="""
    The height in pixels that the rendered legend glyph should occupy.
    """)

    glyph_width = Int(20, help="""
    The width in pixels that the rendered legend glyph should occupy.
    """)

    legend_padding = Int(10, help="""
    Amount of padding around the legend.
    """)

    legend_spacing = Int(3, help="""
    Amount of spacing between legend entried
    """)

    legends = List(Tuple(String, List(Instance(GlyphRenderer))), help="""
    A list of tuples that maps text labels to the legend to corresponding
    renderers that should draw sample representations for those labels.

    .. note::
        The ``legends`` attribute may also be set from a dict or OrderedDict,
        but note that if a dict is used, the order of the legend entries is
        unspecified.

    """).accepts(
        Dict(String, List(Instance(GlyphRenderer))), lambda d: list(d.items())
    )

class GuideRenderer(Renderer):
    """ A base class for all guide renderer types. ``GuideRenderer`` is
    not generally useful to instantiate on its own.

    """

    plot = Instance(".models.plots.Plot", help="""
    The plot to which this guide renderer is attached.
    """)

    def __init__(self, **kwargs):
        super(GuideRenderer, self).__init__(**kwargs)

        if self.plot is not None:
            if self not in self.plot.renderers:
                self.plot.renderers.append(self)
