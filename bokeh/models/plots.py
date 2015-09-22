""" Models for representing top-level plot objects.

"""
from __future__ import absolute_import

from six import string_types

from ..enums import Location
from ..mixins import LineProps, TextProps
from ..plot_object import PlotObject
from ..properties import Bool, Int, String, Color, Enum, Auto, Instance, Either, List, Dict, Include
from ..query import find
from ..util.string import nice_join
from ..validation.warnings import (MISSING_RENDERERS, NO_GLYPH_RENDERERS,
    EMPTY_LAYOUT, MALFORMED_CATEGORY_LABEL)
from ..validation.errors import REQUIRED_RANGE
from .. import validation

from .glyphs import Glyph
from .ranges import Range, Range1d, FactorRange
from .renderers import Renderer, GlyphRenderer
from .sources import DataSource, ColumnDataSource
from .tools import Tool, ToolEvents
from .widget import Widget

def _select_helper(args, kwargs):
    """
    Allow fexible selector syntax.
    Returns:
        a dict
    """
    if len(args) > 1:
        raise TypeError("select accepts at most ONE positional argument.")

    if len(args) > 0 and len(kwargs) > 0:
        raise TypeError("select accepts EITHER a positional argument, OR keyword arguments (not both).")

    if len(args) == 0 and len(kwargs) == 0:
        raise TypeError("select requires EITHER a positional argument, OR keyword arguments.")

    if args:
        arg = args[0]
        if isinstance(arg, dict):
            selector = arg
        elif isinstance(arg, string_types):
            selector = dict(name=arg)
        elif issubclass(arg, PlotObject):
            selector = {"type" : arg}
        else:
            raise RuntimeError("Selector must be a dictionary, string or plot object.")

    else:
        selector = kwargs
    return selector


class PlotContext(PlotObject):
    """ A container for multiple plot objects.

    ``PlotContext`` objects are a source of confusion. Their purpose
    is to collect together different top-level objects (e.g., ``Plot``
    or layout widgets). The reason for this is that different plots may
    need to share ranges or data sources between them. A ``PlotContext``
    is a container in which such sharing can occur between the contained
    objects.
    """

    children = List(Instance(PlotObject), help="""
    A list of top level objects in this ``PlotContext`` container.
    """)

# TODO (bev) : is this used anywhere?
class PlotList(PlotContext):
    # just like plot context, except plot context has special meaning
    # everywhere, so plotlist is the generic one
    pass

class Plot(Widget):
    """ Model representing a plot, containing glyphs, guides, annotations.

    """

    def __init__(self, **kwargs):
        if "tool_events" not in kwargs:
            kwargs["tool_events"] = ToolEvents()
        super(Plot, self).__init__(**kwargs)

    def select(self, *args, **kwargs):
        ''' Query this object and all of its references for objects that
        match the given selector.

        There are a few different ways to call the ``select`` method.
        The most general is to supply a JSON-like query dictionary as the
        single argument or as keyword arguments:

        Args:
            selector (JSON-like) : some sample text

        Keyword Arguments:
            kwargs : query dict key/values as keyword arguments

        For convenience, queries on just names can be made by supplying
        the ``name`` string as the single parameter:

        Args:
            name (str) : the name to query on

        Also queries on just type can be made simply by supplying the
        ``PlotObject`` subclass as the single parameter:

        Args:
            type (PlotObject) : the type to query on

        Returns:
            seq[PlotObject]

        Examples:

            .. code-block:: python

                # These two are equivalent
                p.select({"type": HoverTool})
                p.select(HoverTool)

                # These two are also equivalent
                p.select({"name": "mycircle"})
                p.select("mycircle")

                # Keyword arguments can be supplied in place of selector dict
                p.select({"name": "foo", "type": HoverTool})
                p.select(name="foo", type=HoverTool)

        '''

        selector = _select_helper(args, kwargs)

        # Want to pass selector that is a dictionary
        from ..plotting_helpers import _list_attr_splat
        return _list_attr_splat(find(self.references(), selector, {'plot': self}))

    def row(self, row, gridplot):
        ''' Return whether this plot is in a given row of a GridPlot.

        Args:
            row (int) : index of the row to test
            gridplot (GridPlot) : the GridPlot to check

        Returns:
            bool

        '''
        return self in gridplot.row(row)

    def column(self, col, gridplot):
        ''' Return whether this plot is in a given column of a GridPlot.

        Args:
            col (int) : index of the column to test
            gridplot (GridPlot) : the GridPlot to check

        Returns:
            bool

        '''
        return self in gridplot.column(col)

    def add_layout(self, obj, place='center'):
        ''' Adds an object to the plot in a specified place.

        Args:
            obj (Renderer) : the object to add to the Plot
            place (str, optional) : where to add the object (default: 'center')
                Valid places are: 'left', 'right', 'above', 'below', 'center'.

        Returns:
            None

        '''
        valid_places = ['left', 'right', 'above', 'below', 'center']
        if place not in valid_places:
            raise ValueError(
                "Invalid place '%s' specified. Valid place values are: %s" % (place, nice_join(valid_places))
            )

        if hasattr(obj, 'plot'):
            if obj.plot is not None:
                raise ValueError("object to be added already has 'plot' attribute set")
            obj.plot = self

        self.renderers.append(obj)

        if place is not 'center':
            getattr(self, place).append(obj)

    def add_tools(self, *tools):
        ''' Adds an tools to the plot.

        Args:
            *tools (Tool) : the tools to add to the Plot

        Returns:
            None

        '''
        if not all(isinstance(tool, Tool) for tool in tools):
            raise ValueError("All arguments to add_tool must be Tool subclasses.")

        for tool in tools:
            if tool.plot is not None:
                raise ValueError("tool %s to be added already has 'plot' attribute set" % tool)
            tool.plot = self
            self.tools.append(tool)

    def add_glyph(self, source_or_glyph, glyph=None, **kw):
        ''' Adds a glyph to the plot with associated data sources and ranges.

        This function will take care of creating and configurinf a Glyph object,
        and then add it to the plot's list of renderers.

        Args:
            source (DataSource) : a data source for the glyphs to all use
            glyph (Glyph) : the glyph to add to the Plot


        Keyword Arguments:
            Any additional keyword arguments are passed on as-is to the
            Glyph initializer.

        Returns:
            glyph : Glyph

        '''
        if glyph is not None:
            source = source_or_glyph
        else:
            source, glyph = ColumnDataSource(), source_or_glyph

        if not isinstance(source, DataSource):
            raise ValueError("'source' argument to add_glyph() must be DataSource subclass")

        if not isinstance(glyph, Glyph):
            raise ValueError("'glyph' argument to add_glyph() must be Glyph subclass")

        g = GlyphRenderer(data_source=source, glyph=glyph, **kw)
        self.renderers.append(g)
        return g

    @validation.error(REQUIRED_RANGE)
    def _check_required_range(self):
        missing = []
        if not self.x_range: missing.append('x_range')
        if not self.y_range: missing.append('y_range')
        if missing:
            return ", ".join(missing) + " [%s]" % self

    @validation.warning(MISSING_RENDERERS)
    def _check_missing_renderers(self):
        if len(self.renderers) == 0:
            return str(self)

    @validation.warning(NO_GLYPH_RENDERERS)
    def _check_no_glyph_renderers(self):
        if len(self.select(GlyphRenderer)) == 0:
            return str(self)

    @validation.warning(MALFORMED_CATEGORY_LABEL)
    def _check_colon_in_category_label(self):
        if not self.x_range: return
        if not self.y_range: return

        broken = []

        for range_name in ['x_range', 'y_range']:
            category_range = getattr(self, range_name)
            if not isinstance(category_range, FactorRange): continue

            for value in category_range.factors:
                if not isinstance(value, string_types): break
                if ':' in value:
                    broken.append((range_name, value))
                    break

        if broken:
            field_msg = ' '.join('[range:%s] [first_value: %s]' % (field, value)
                                 for field, value in broken)
            return '%s [renderer: %s]' % (field_msg, self)

    x_range = Instance(Range, help="""
    The (default) data range of the horizontal dimension of the plot.
    """)

    y_range = Instance(Range, help="""
    The (default) data range of the vertical dimension of the plot.
    """)

    x_mapper_type = Either(Auto, String, help="""
    What kind of mapper to use to convert x-coordinates in data space
    into x-coordinates in screen space.

    Typically this can be determined automatically, but this property
    can be useful to, e.g., show datetime values as floating point
    "seconds since epoch" instead of formatted dates.
    """)

    y_mapper_type = Either(Auto, String, help="""
    What kind of mapper to use to convert y-coordinates in data space
    into y-coordinates in screen space.

    Typically this can be determined automatically, but this property
    can be useful to, e.g., show datetime values as floating point
    "seconds since epoch" instead of formatted dates
    """)

    extra_x_ranges = Dict(String, Instance(Range1d), help="""
    Additional named ranges to make available for mapping x-coordinates.

    This is useful for adding additional axes.
    """)

    extra_y_ranges = Dict(String, Instance(Range), help="""
    Additional named ranges to make available for mapping y-coordinates.

    This is useful for adding additional axes.
    """)

    title = String('', help="""
    A title for the plot.
    """)

    title_props = Include(TextProps, help="""
    The %s for the plot title.
    """)

    outline_props = Include(LineProps, help="""
    The %s for the plot border outline.
    """)

    renderers = List(Instance(Renderer), help="""
    A list of all renderers for this plot, including guides and annotations
    in addition to glyphs and markers.

    This property can be manipulated by hand, but the ``add_glyph`` and
    ``add_layout`` methods are recommended to help make sure all necessary
    setup is performed.
    """)

    tools = List(Instance(Tool), help="""
    A list of tools to add to the plot.
    """)

    tool_events = Instance(ToolEvents, help="""
    A ToolEvents object to share and report tool events.
    """)

    left  = List(Instance(Renderer), help="""
    A list of renderers to occupy the area to the left of the plot.
    """)

    right = List(Instance(Renderer), help="""
    A list of renderers to occupy the area to the right of the plot.
    """)

    above = List(Instance(Renderer), help="""
    A list of renderers to occupy the area above of the plot.
    """)

    below = List(Instance(Renderer), help="""
    A list of renderers to occupy the area below of the plot.
    """)

    toolbar_location = Enum(Location, help="""
    Where the toolbar will be located. If set to None, no toolbar
    will be attached to the plot.
    """)

    logo = Enum("normal", "grey", help="""
    What version of the Bokeh logo to display on the toolbar. If
    set to None, no logo will be displayed.
    """)

    plot_height = Int(600, help="""
    Total height of the entire plot (including any axes, titles,
    border padding, etc.)

    .. note::
        This corresponds directly to the height of the HTML
        canvas that will be used.

    """)

    plot_width = Int(600, help="""
    Total width of the entire plot (including any axes, titles,
    border padding, etc.)

    .. note::
        This corresponds directly to the width of the HTML
        canvas that will be used.

    """)

    background_fill = Color("white", help="""

    """)

    border_fill = Color("white", help="""

    """)

    min_border_top = Int(50, help="""
    Minimum size in pixels of the padding region above the top of the
    central plot region.

    .. note::
        This is a *minimum*. The padding region may expand as needed to
        accommodate titles or axes, etc.

    """)

    min_border_bottom = Int(50, help="""
    Minimum size in pixels of the padding region below the bottom of
    the central plot region.

    .. note::
        This is a *minimum*. The padding region may expand as needed to
        accommodate titles or axes, etc.

    """)

    min_border_left = Int(50, help="""
    Minimum size in pixels of the padding region to the left of
    the central plot region.

    .. note::
        This is a *minimum*. The padding region may expand as needed to
        accommodate titles or axes, etc.

    """)

    min_border_right = Int(50, help="""
    Minimum size in pixels of the padding region to the right of
    the central plot region.

    .. note::
        This is a *minimum*. The padding region may expand as needed to
        accommodate titles or axes, etc.

    """)

    min_border = Int(50, help="""
    A convenience property to set all all the ``min_X_border`` properties
    to the same value. If an individual border property is explicitly set,
    it will override ``min_border``.
    """)

    h_symmetry = Bool(True, help="""
    Whether the total horizontal padding on both sides of the plot will
    be made equal (the left or right padding amount, whichever is larger).
    """)


    v_symmetry = Bool(False, help="""
    Whether the total vertical padding on both sides of the plot will
    be made equal (the top or bottom padding amount, whichever is larger).
    """)

    lod_factor = Int(10, help="""
    Decimation factor to use when applying level-of-detail decimation.
    """)

    lod_threshold = Int(2000, help="""
    A number of data points, above which level-of-detail downsampling may
    be performed by glyph renderers. Set to ``None`` to disable any
    level-of-detail downsampling.
    """)

    lod_interval = Int(300, help="""
    Interval (in ms) during which an interactive tool event will enable
    level-of-detail downsampling.
    """)

    lod_timeout = Int(500, help="""
    Timeout (in ms) for checking whether interactive tool events are still
    occurring. Once level-of-detail mode is enabled, a check is made every
    ``lod_timeout`` ms. If no interactive tool events have happened,
    level-of-detail mode is disabled.
    """)

    webgl = Bool(False, help="""
    Whether WebGL is enabled for this plot. If True, the glyphs that
    support this will render via WebGL instead of the 2D canvas.
    """)

    responsive = Bool(False, help="""
    If True, the plot will automatically resize based on the size of its container. The
    aspect ratio of the plot will be preserved, but ``plot_width`` and ``plot_height`` will
    act only to set the initial aspect ratio.
    .. warning::

       The responsive setting is known not to work with HBox layout and may not work
       in combination with other widgets or layouts.
    """)


class GridPlot(Plot):
    """ A 2D grid of plots rendered on separate canvases in an HTML table.

    """

    # TODO (bev) really, GridPlot should be a layout, not a Plot subclass
    @validation.error(REQUIRED_RANGE)
    def _check_required_range(self):
        pass
    @validation.warning(MISSING_RENDERERS)
    def _check_missing_renderers(self):
        pass
    @validation.warning(NO_GLYPH_RENDERERS)
    def _check_no_glyph_renderers(self):
        pass

    @validation.warning(EMPTY_LAYOUT)
    def _check_empty_layout(self):
        from itertools import chain
        if not list(chain(self.children)):
            return str(self)

    children = List(List(Instance(Plot)), help="""
    An array of plots to display in a grid, given as a list of lists of
    Plot objects. To leave a position in the grid empty, pass None for
    that position in the ``children`` list.
    """)

    border_space = Int(0, help="""
    Distance (in pixels) between adjacent plots.
    """)

    def select(self, *args, **kwargs):
        ''' Query this object and all of its references for objects that
        match the given selector. See Plot.select for detailed usage infomation.

        Returns:
            seq[PlotObject]

        '''

        selector = _select_helper(args, kwargs)

        # Want to pass selector that is a dictionary
        from ..plotting_helpers import _list_attr_splat
        return _list_attr_splat(find(self.references(), selector, {'gridplot': self}))

    def column(self, col):
        ''' Return a given column of plots from this GridPlot.

        Args:
            col (int) : index of the column to return

        Returns:
            seq[Plot] : column of plots

        '''
        try:
            return [row[col] for row in self.children]
        except:
            return []

    def row(self, row):
        ''' Return a given row of plots from this GridPlot.

        Args:
            rwo (int) : index of the row to return

        Returns:
            seq[Plot] : row of plots

        '''
        try:
            return self.children[row]
        except:
            return []
