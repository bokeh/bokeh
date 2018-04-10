''' Models for representing top-level plot objects.

'''
from __future__ import absolute_import

from ..core.enums import Location, OutputBackend
from ..core.properties import Bool, Dict, Enum, Include, Instance, Int, List, Override, String, Float
from ..core.property_mixins import LineProps, FillProps
from ..core.query import find
from ..core.validation import error, warning
from ..core.validation.errors import REQUIRED_RANGE, REQUIRED_SCALE, INCOMPATIBLE_SCALE_AND_RANGE
from ..core.validation.warnings import MISSING_RENDERERS
from ..util.plot_utils import _list_attr_splat, _select_helper
from ..util.string import nice_join

from .annotations import Legend, Title
from .axes import Axis
from .glyphs import Glyph
from .grids import Grid
from .layouts import LayoutDOM
from .ranges import Range, FactorRange, DataRange1d, Range1d
from .renderers import GlyphRenderer, Renderer, TileRenderer
from .scales import Scale, CategoricalScale, LinearScale, LogScale
from .sources import DataSource, ColumnDataSource
from .tools import Tool, Toolbar

def _check_conflicting_kwargs(a1, a2, kwargs):
    if a1 in kwargs and a2 in kwargs:
        raise ValueError("Conflicting properties set on plot: %r and %r" % (a1, a2))

class Plot(LayoutDOM):
    ''' Model representing a plot, containing glyphs, guides, annotations.

    '''

    def __init__(self, **kwargs):
        '''

        '''
        _check_conflicting_kwargs("toolbar", "tools", kwargs)
        _check_conflicting_kwargs("toolbar", "logo", kwargs)

        if "toolbar" not in kwargs:
            tools = kwargs.pop('tools', [])
            logo = kwargs.pop('logo', 'normal')
            kwargs["toolbar"] = Toolbar(tools=tools, logo=logo)

        super(LayoutDOM, self).__init__(**kwargs)

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
        ``Model`` subclass as the single parameter:

        Args:
            type (Model) : the type to query on

        Returns:
            seq[Model]

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

    def _axis(self, *sides):
        objs = []
        for s in sides:
            objs.extend(getattr(self, s, []))
        axis = [obj for obj in objs if isinstance(obj, Axis)]
        return _list_attr_splat(axis)

    @property
    def xaxis(self):
        ''' Splattable list of :class:`~bokeh.models.axes.Axis` objects for the x dimension.

        '''
        return self._axis("above", "below")

    @property
    def yaxis(self):
        ''' Splattable list of :class:`~bokeh.models.axes.Axis` objects for the y dimension.

        '''
        return self._axis("left", "right")

    @property
    def axis(self):
        ''' Splattable list of :class:`~bokeh.models.axes.Axis` objects.

        '''
        return _list_attr_splat(self.xaxis + self.yaxis)

    @property
    def legend(self):
        ''' Splattable list of :class:`~bokeh.models.annotations.Legend` objects.

        '''
        legends = [obj for obj in self.renderers if isinstance(obj, Legend)]
        return _list_attr_splat(legends)

    def _grid(self, dimension):
        grid = [obj for obj in self.renderers if isinstance(obj, Grid) and obj.dimension==dimension]
        return _list_attr_splat(grid)

    @property
    def xgrid(self):
        ''' Splattable list of :class:`~bokeh.models.grids.Grid` objects for the x dimension.

        '''
        return self._grid(0)

    @property
    def ygrid(self):
        ''' Splattable list of :class:`~bokeh.models.grids.Grid` objects for the y dimension.

        '''
        return self._grid(1)

    @property
    def grid(self):
        ''' Splattable list of :class:`~bokeh.models.grids.Grid` objects.

        '''
        return _list_attr_splat(self.xgrid + self.ygrid)

    @property
    def tools(self):
        return self.toolbar.tools

    @tools.setter
    def tools(self, tools):
        self.toolbar.tools = tools

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
        ''' Adds tools to the plot.

        Args:
            *tools (Tool) : the tools to add to the Plot

        Returns:
            None

        '''
        for tool in tools:
            if not isinstance(tool, Tool):
                raise ValueError("All arguments to add_tool must be Tool subclasses.")

            if hasattr(tool, 'overlay'):
                self.renderers.append(tool.overlay)

            self.toolbar.tools.append(tool)

    def add_glyph(self, source_or_glyph, glyph=None, **kw):
        ''' Adds a glyph to the plot with associated data sources and ranges.

        This function will take care of creating and configuring a Glyph object,
        and then add it to the plot's list of renderers.

        Args:
            source (DataSource) : a data source for the glyphs to all use
            glyph (Glyph) : the glyph to add to the Plot


        Keyword Arguments:
            Any additional keyword arguments are passed on as-is to the
            Glyph initializer.

        Returns:
            GlyphRenderer

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

    def add_tile(self, tile_source, **kw):
        ''' Adds new TileRenderer into the Plot.renderers

        Args:
            tile_source (TileSource) : a tile source instance which contain tileset configuration

        Keyword Arguments:
            Additional keyword arguments are passed on as-is to the tile renderer

        Returns:
            TileRenderer : TileRenderer

        '''
        tile_renderer = TileRenderer(tile_source=tile_source, **kw)
        self.renderers.append(tile_renderer)
        return tile_renderer

    @error(REQUIRED_RANGE)
    def _check_required_range(self):
        missing = []
        if not self.x_range: missing.append('x_range')
        if not self.y_range: missing.append('y_range')
        if missing:
            return ", ".join(missing) + " [%s]" % self

    @error(REQUIRED_SCALE)
    def _check_required_scale(self):
        missing = []
        if not self.x_scale: missing.append('x_scale')
        if not self.y_scale: missing.append('y_scale')
        if missing:
            return ", ".join(missing) + " [%s]" % self

    @error(INCOMPATIBLE_SCALE_AND_RANGE)
    def _check_compatible_scale_and_ranges(self):
        incompatible = []
        x_ranges = list(self.extra_x_ranges.values())
        if self.x_range: x_ranges.append(self.x_range)
        y_ranges = list(self.extra_y_ranges.values())
        if self.y_range: y_ranges.append(self.y_range)

        for rng in x_ranges:
            if isinstance(rng, (DataRange1d, Range1d)) and not isinstance(self.x_scale, (LinearScale, LogScale)):
                incompatible.append("incompatibility on x-dimension: %s, %s" %(rng, self.x_scale))
            elif isinstance(rng, FactorRange) and not isinstance(self.x_scale, CategoricalScale):
                incompatible.append("incompatibility on x-dimension: %s/%s" %(rng, self.x_scale))
            # special case because CategoricalScale is a subclass of LinearScale, should be removed in future
            if isinstance(rng, (DataRange1d, Range1d)) and isinstance(self.x_scale, CategoricalScale):
                incompatible.append("incompatibility on x-dimension: %s, %s" %(rng, self.x_scale))

        for rng in y_ranges:
            if isinstance(rng, (DataRange1d, Range1d)) and not isinstance(self.y_scale, (LinearScale, LogScale)):
                incompatible.append("incompatibility on y-dimension: %s/%s" %(rng, self.y_scale))
            elif isinstance(rng, FactorRange) and not isinstance(self.y_scale, CategoricalScale):
                incompatible.append("incompatibility on y-dimension: %s/%s" %(rng, self.y_scale))
            # special case because CategoricalScale is a subclass of LinearScale, should be removed in future
            if isinstance(rng, (DataRange1d, Range1d)) and isinstance(self.y_scale, CategoricalScale):
                incompatible.append("incompatibility on y-dimension: %s, %s" %(rng, self.y_scale))

        if incompatible:
            return ", ".join(incompatible) + " [%s]" % self

    @warning(MISSING_RENDERERS)
    def _check_missing_renderers(self):
        if len(self.renderers) == 0:
            return str(self)

    x_range = Instance(Range, help="""
    The (default) data range of the horizontal dimension of the plot.
    """)

    y_range = Instance(Range, help="""
    The (default) data range of the vertical dimension of the plot.
    """)

    @classmethod
    def _scale(cls, scale):
        if scale in ["auto", "linear"]:
            return LinearScale()
        elif scale == "log":
            return LogScale()
        if scale == "categorical":
            return CategoricalScale()
        else:
            raise ValueError("Unknown mapper_type: %s" % scale)

    x_scale = Instance(Scale, default=lambda: LinearScale(), help="""
    What kind of scale to use to convert x-coordinates in data space
    into x-coordinates in screen space.
    """)

    y_scale = Instance(Scale, default=lambda: LinearScale(), help="""
    What kind of scale to use to convert y-coordinates in data space
    into y-coordinates in screen space.
    """)

    extra_x_ranges = Dict(String, Instance(Range), help="""
    Additional named ranges to make available for mapping x-coordinates.

    This is useful for adding additional axes.
    """)

    extra_y_ranges = Dict(String, Instance(Range), help="""
    Additional named ranges to make available for mapping y-coordinates.

    This is useful for adding additional axes.
    """)

    hidpi = Bool(default=True, help="""
    Whether to use HiDPI mode when available.
    """)

    title = Instance(Title, default=lambda: Title(text=""), help="""
    A title for the plot. Can be a text string or a Title annotation.
    """)

    title_location = Enum(Location, default="above", help="""
    Where the title will be located. Titles on the left or right side
    will be rotated.
    """)

    outline_props = Include(LineProps, help="""
    The %s for the plot border outline.
    """)

    outline_line_color = Override(default="#e5e5e5")

    renderers = List(Instance(Renderer), help="""
    A list of all renderers for this plot, including guides and annotations
    in addition to glyphs and markers.

    This property can be manipulated by hand, but the ``add_glyph`` and
    ``add_layout`` methods are recommended to help make sure all necessary
    setup is performed.
    """)

    toolbar = Instance(Toolbar, help="""
    The toolbar associated with this plot which holds all the tools. It is
    automatically created with the plot if necessary.
    """)

    toolbar_location = Enum(Location, default="right", help="""
    Where the toolbar will be located. If set to None, no toolbar
    will be attached to the plot.
    """)

    toolbar_sticky = Bool(default=True, help="""
    Stick the toolbar to the edge of the plot. Default: True. If False,
    the toolbar will be outside of the axes, titles etc.
    """)

    left = List(Instance(Renderer), help="""
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

    inner_width = Int(readonly=True, help="""
    This is the exact width of the plotting canvas, i.e. the width of
    the actual plot, without toolbars etc. Note this is computed in a
    web browser, so this property will work only in backends capable of
    bidirectional communication (server, notebook).

    .. note::
        This is an experimental feature and the API may change in near future.

    """)

    inner_height = Int(readonly=True, help="""
    This is the exact height of the plotting canvas, i.e. the height of
    the actual plot, without toolbars etc. Note this is computed in a
    web browser, so this property will work only in backends capable of
    bidirectional communication (server, notebook).

    .. note::
        This is an experimental feature and the API may change in near future.

    """)

    layout_width = Int(readonly=True, help="""
    This is the exact width of the layout, i.e. the height of
    the actual plot, with toolbars etc. Note this is computed in a
    web browser, so this property will work only in backends capable of
    bidirectional communication (server, notebook).

    .. note::
        This is an experimental feature and the API may change in near future.

    """)

    layout_height = Int(readonly=True, help="""
    This is the exact height of the layout, i.e. the height of
    the actual plot, with toolbars etc. Note this is computed in a
    web browser, so this property will work only in backends capable of
    bidirectional communication (server, notebook).

    .. note::
        This is an experimental feature and the API may change in near future.

    """)

    background_props = Include(FillProps, help="""
    The %s for the plot background style.
    """)

    background_fill_color = Override(default='#ffffff')

    border_props = Include(FillProps, help="""
    The %s for the plot border style.
    """)

    border_fill_color = Override(default='#ffffff')

    min_border_top = Int(help="""
    Minimum size in pixels of the padding region above the top of the
    central plot region.

    .. note::
        This is a *minimum*. The padding region may expand as needed to
        accommodate titles or axes, etc.

    """)

    min_border_bottom = Int(help="""
    Minimum size in pixels of the padding region below the bottom of
    the central plot region.

    .. note::
        This is a *minimum*. The padding region may expand as needed to
        accommodate titles or axes, etc.

    """)

    min_border_left = Int(help="""
    Minimum size in pixels of the padding region to the left of
    the central plot region.

    .. note::
        This is a *minimum*. The padding region may expand as needed to
        accommodate titles or axes, etc.

    """)

    min_border_right = Int(help="""
    Minimum size in pixels of the padding region to the right of
    the central plot region.

    .. note::
        This is a *minimum*. The padding region may expand as needed to
        accommodate titles or axes, etc.

    """)

    min_border = Int(5, help="""
    A convenience property to set all all the ``min_border_X`` properties
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

    output_backend = Enum(OutputBackend, default="canvas", help="""
    Specify the output backend for the plot area. Default is HTML5 Canvas.

    .. note::
        When set to ``webgl``, glyphs without a WebGL rendering implementation
        will fall back to rendering onto 2D canvas.
    """)

    match_aspect = Bool(default=False, help="""
    Specify the aspect ratio behavior of the plot. Aspect ratio is defined as
    the ratio of width over height. This property controls whether Bokeh should
    attempt the match the (width/height) of *data space* to the (width/height)
    in pixels of *screen space*.

    Default is ``False`` which indicates that the *data* aspect ratio and the
    *screen* aspect ratio vary independently. ``True`` indicates that the plot
    aspect ratio of the axes will match the aspect ratio of the pixel extent
    the axes. The end result is that a 1x1 area in data space is a square in
    pixels, and conversely that a 1x1 pixel is a square in data units.

    .. note::
        This setting only takes effect when there are two dataranges. This
        setting only sets the initial plot draw and subsequent resets. It is
        possible for tools (single axis zoom, unconstrained box zoom) to
        change the aspect ratio.

    .. warning::
        This setting is incompatible with linking dataranges across multiple
        plots. Doing so may result in undefined behaviour.
    """)

    aspect_scale = Float(default=1, help="""
    A value to be given for increased aspect ratio control. This value is added
    multiplicatively to the calculated value required for ``match_aspect``.
    ``aspect_scale`` is defined as the ratio of width over height of the figure.

    For example, a plot with ``aspect_scale`` value of 2 will result in a
    square in *data units* to be drawn on the screen as a rectangle with a
    pixel width twice as long as its pixel height.

    .. note::
        This setting only takes effect if ``match_aspect`` is set to ``True``.
    """)
