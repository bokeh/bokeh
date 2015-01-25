from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Bool, Int, String, Color, Enum, Auto, Instance, Either, List, Dict, Include
from ..mixins import LineProps, TextProps
from .. enums import Location

from ..utils import nice_join
from ..query import find

from .widget import Widget
from .sources import DataSource, ColumnDataSource
from .ranges import Range, Range1d
from .renderers import Renderer, GlyphRenderer
from .tools import Tool, ToolEvents
from .glyphs import Glyph

# TODO (bev) dupe, move to utils
class _list_attr_splat(list):
    def __setattr__(self, attr, value):
        for x in self:
            setattr(x, attr, value)

class PlotContext(PlotObject):
    """ A container for multiple plot objects.

    """

    children = List(Instance(PlotObject), help="""

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

    def select(self, selector):
        ''' Query this object and all of its references for objects that
        match the given selector.

        Args:
            selector (JSON-like) :

        Returns:
            seq[PlotObject]

        '''
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

    x_range = Instance(Range, help="""

    """)

    y_range = Instance(Range, help="""

    """)

    x_mapper_type = Either(Auto, String, help="""

    """)

    y_mapper_type = Either(Auto, String, help="""

    """)

    extra_x_ranges = Dict(String, Instance(Range1d), help="""

    """)

    extra_y_ranges = Dict(String, Instance(Range1d), help="""

    """)

    title = String('', help="""

    """)

    title_props = Include(TextProps, help="""

    """)

    outline_props = Include(LineProps, help="""

    """)

    # A list of all renderers on this plot; this includes guides as well
    # as glyph renderers
    renderers = List(Instance(Renderer), help="""

    """)

    tools = List(Instance(Tool), help="""

    """)

    tool_events = Instance(ToolEvents, help="""

    """)

    left  = List(Instance(Renderer), help="""

    """)

    right = List(Instance(Renderer), help="""

    """)

    above = List(Instance(Renderer), help="""

    """)

    below = List(Instance(Renderer), help="""

    """)

    toolbar_location = Enum(Location, help="""

    """)

    logo = Enum("normal", "grey", help="""

    """)

    plot_height = Int(600, help="""

    """)

    plot_width = Int(600, help="""

    """)

    background_fill = Color("white", help="""

    """)

    border_fill = Color("white", help="""

    """)

    min_border_top = Int(50, help="""

    """)

    min_border_bottom = Int(50, help="""

    """)

    min_border_left = Int(50, help="""

    """)

    min_border_right = Int(50, help="""

    """)

    min_border = Int(50, help="""

    """)

    h_symmetry = Bool(True, help="""

    """)

    v_symmetry = Bool(False, help="""

    """)

class GridPlot(Plot):
    """ A 2D grid of plots rendered on separate canvases in an HTML table.

    """

    children = List(List(Instance(Plot)), help="""

    """)

    border_space = Int(0, help="""

    """)

    def select(self, selector):
        ''' Query this object and all of its references for objects that
        match the given selector.

        Args:
            selector (JSON-like) :

        Returns:
            seq[PlotObject]

        '''
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
