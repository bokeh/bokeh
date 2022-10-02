#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Models for representing top-level plot objects.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import warnings
from contextlib import contextmanager
from typing import (
    Any,
    Generator,
    Literal,
    overload,
)

# External imports
import xyzservices

# Bokeh imports
from ..core.enums import (
    Location,
    OutputBackend,
    Place,
    PlaceType,
    ResetPolicy,
)
from ..core.properties import (
    Bool,
    Dict,
    Either,
    Enum,
    Float,
    Include,
    Instance,
    InstanceDefault,
    Int,
    List,
    Null,
    Nullable,
    Override,
    Readonly,
    String,
    Struct,
    Tuple,
)
from ..core.property.struct import Optional
from ..core.property_mixins import ScalarFillProps, ScalarLineProps
from ..core.query import find
from ..core.validation import error, warning
from ..core.validation.errors import (
    BAD_EXTRA_RANGE_NAME,
    INCOMPATIBLE_SCALE_AND_RANGE,
    REPEATED_LAYOUT_CHILD,
    REQUIRED_RANGE,
    REQUIRED_SCALE,
)
from ..core.validation.warnings import MISSING_RENDERERS
from ..model import Model
from ..util.strings import nice_join
from .annotations import Annotation, Legend, Title
from .axes import Axis
from .glyphs import Glyph
from .grids import Grid
from .layouts import LayoutDOM, TracksSizing
from .ranges import (
    DataRange1d,
    FactorRange,
    Range,
    Range1d,
)
from .renderers import GlyphRenderer, Renderer, TileRenderer
from .scales import (
    CategoricalScale,
    LinearScale,
    LogScale,
    Scale,
)
from .sources import ColumnarDataSource, ColumnDataSource, DataSource
from .tiles import TileSource, WMTSTileSource
from .tools import HoverTool, Tool, Toolbar

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'GridPlot',
    'Plot',
)

def LRTB(type: Any) -> Struct:
    return Struct(left=type, right=type, top=type, bottom=type)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Plot(LayoutDOM):
    ''' Model representing a plot, containing glyphs, guides, annotations.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

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

        Additionally, for compatibility with ``Model.select``, a selector
        dict may be passed as ``selector`` keyword argument, in which case
        the value of ``kwargs['selector']`` is used for the query.

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

                # These three are equivalent
                p.select(selector={"type": HoverTool})
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
        return _list_attr_splat(find(self.references(), selector))

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
        ''' Splattable list of |Legend| objects.

        '''
        panels = self.above + self.below + self.left + self.right + self.center
        legends = [obj for obj in panels if isinstance(obj, Legend)]
        return _legend_attr_splat(legends)

    @property
    def hover(self):
        ''' Splattable list of :class:`~bokeh.models.tools.HoverTool` objects.

        '''
        hovers = [obj for obj in self.tools if isinstance(obj, HoverTool)]
        return _list_attr_splat(hovers)

    def _grid(self, dimension: Literal[0, 1]):
        grid = [obj for obj in self.center if isinstance(obj, Grid) and obj.dimension == dimension]
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
    def tools(self) -> list[Tool]:
        return self.toolbar.tools

    @tools.setter
    def tools(self, tools: list[Tool]):
        self.toolbar.tools = tools

    def add_layout(self, obj: Renderer, place: PlaceType = "center") -> None:
        ''' Adds an object to the plot in a specified place.

        Args:
            obj (Renderer) : the object to add to the Plot
            place (str, optional) : where to add the object (default: 'center')
                Valid places are: 'left', 'right', 'above', 'below', 'center'.

        Returns:
            None

        '''
        if place not in Place:
            raise ValueError(
                f"Invalid place '{place}' specified. Valid place values are: {nice_join(Place)}"
            )

        getattr(self, place).append(obj)

    def add_tools(self, *tools: Tool) -> None:
        ''' Adds tools to the plot.

        Args:
            *tools (Tool) : the tools to add to the Plot

        Returns:
            None

        '''
        for tool in tools:
            if not isinstance(tool, Tool):
                raise ValueError("All arguments to add_tool must be Tool subclasses.")

            self.toolbar.tools.append(tool)

    def remove_tools(self, *tools: Tool) -> None:
        ''' Removes tools from the plot.

        Args:
            *tools (Tool) : the tools to remove from the Plot

        Returns:
            None

        '''
        for tool in tools:
            if not isinstance(tool, Tool):
                raise ValueError("All arguments to remove_tool must be Tool subclasses.")
            elif tool not in self.toolbar.tools:
                raise ValueError(f"Invalid tool {tool} specified. Available tools are {nice_join(self.toolbar.tools)}")
            self.toolbar.tools.remove(tool)

    @overload
    def add_glyph(self, glyph: Glyph, **kwargs: Any) -> GlyphRenderer: ...
    @overload
    def add_glyph(self, source: ColumnarDataSource, glyph: Glyph, **kwargs: Any) -> GlyphRenderer: ...

    def add_glyph(self, source_or_glyph: Glyph | ColumnarDataSource, glyph: Glyph | None = None, **kwargs: Any) -> GlyphRenderer:
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
        if isinstance(source_or_glyph, ColumnarDataSource):
            source = source_or_glyph
        else:
            source, glyph = ColumnDataSource(), source_or_glyph

        if not isinstance(source, DataSource):
            raise ValueError("'source' argument to add_glyph() must be DataSource subclass")

        if not isinstance(glyph, Glyph):
            raise ValueError("'glyph' argument to add_glyph() must be Glyph subclass")

        g = GlyphRenderer(data_source=source, glyph=glyph, **kwargs)
        self.renderers.append(g)
        return g

    def add_tile(self, tile_source: TileSource | xyzservices.TileProvider | str, retina: bool = False, **kwargs: Any) -> TileRenderer:
        ''' Adds new ``TileRenderer`` into ``Plot.renderers``

        Args:
            tile_source (TileSource, xyzservices.TileProvider, str) :
                A tile source instance which contain tileset configuration

            retina (bool) :
                Whether to use retina version of tiles (if available)

        Keyword Arguments:
            Additional keyword arguments are passed on as-is to the tile renderer

        Returns:
            TileRenderer : TileRenderer

        '''
        if not isinstance(tile_source, TileSource):

            if isinstance(tile_source, xyzservices.TileProvider):
                selected_provider = tile_source

            # allow the same string input you can now pass to get_provider
            elif isinstance(tile_source, str):
                # Mapping of custom keys to those used in xyzservices
                tile_source = tile_source.lower()

                if tile_source == "esri_imagery":
                    tile_source = "esri_worldimagery"
                if tile_source == "osm":
                    tile_source = "openstreetmap_mapnik"

                if "retina" in tile_source:
                    tile_source = tile_source.replace("retina", "")
                    retina = True
                selected_provider = xyzservices.providers.query_name(tile_source)

            scale_factor = "@2x" if retina else None

            tile_source = WMTSTileSource(
                url=selected_provider.build_url(scale_factor=scale_factor),
                attribution=selected_provider.html_attribution,
                min_zoom=selected_provider.get("min_zoom", 0),
                max_zoom=selected_provider.get("max_zoom", 30),
            )

        tile_renderer = TileRenderer(tile_source=tile_source, **kwargs)
        self.renderers.append(tile_renderer)
        return tile_renderer

    @contextmanager
    def hold(self, *, render: bool) -> Generator[None, None, None]:
        ''' Takes care of turning a property on and off within a scope.

        Args:
            render (bool) :
                Turns the property hold_render on and off.
        '''
        if render:
            self.hold_render = True
            yield
            self.hold_render = False

    @error(REQUIRED_RANGE)
    def _check_required_range(self) -> str | None:
        missing: list[str] = []
        if not self.x_range: missing.append('x_range')
        if not self.y_range: missing.append('y_range')
        if missing:
            return ", ".join(missing) + " [%s]" % self

    @error(REQUIRED_SCALE)
    def _check_required_scale(self) -> str | None:
        missing: list[str] = []
        if not self.x_scale: missing.append('x_scale')
        if not self.y_scale: missing.append('y_scale')
        if missing:
            return ", ".join(missing) + " [%s]" % self

    @error(INCOMPATIBLE_SCALE_AND_RANGE)
    def _check_compatible_scale_and_ranges(self) -> str | None:
        incompatible: list[str] = []
        x_ranges = list(self.extra_x_ranges.values())
        if self.x_range: x_ranges.append(self.x_range)
        y_ranges = list(self.extra_y_ranges.values())
        if self.y_range: y_ranges.append(self.y_range)

        if self.x_scale is not None:
            for rng in x_ranges:
                if isinstance(rng, (DataRange1d, Range1d)) and not isinstance(self.x_scale, (LinearScale, LogScale)):
                    incompatible.append("incompatibility on x-dimension: %s, %s" %(rng, self.x_scale))
                elif isinstance(rng, FactorRange) and not isinstance(self.x_scale, CategoricalScale):
                    incompatible.append("incompatibility on x-dimension: %s/%s" %(rng, self.x_scale))
                # special case because CategoricalScale is a subclass of LinearScale, should be removed in future
                if isinstance(rng, (DataRange1d, Range1d)) and isinstance(self.x_scale, CategoricalScale):
                    incompatible.append("incompatibility on x-dimension: %s, %s" %(rng, self.x_scale))

        if self.y_scale is not None:
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
    def _check_missing_renderers(self) -> str | None:
        if len(self.renderers) == 0 and len([x for x in self.center if isinstance(x, Annotation)]) == 0:
            return str(self)

    @error(BAD_EXTRA_RANGE_NAME)
    def _check_bad_extra_range_name(self) -> str | None:
        msg: str = ""
        valid = {
            f'{axis}_name': {'default', *getattr(self, f"extra_{axis}s")}
            for axis in ("x_range", "y_range")
        }
        for place in list(Place) + ['renderers']:
            for ref in getattr(self, place):
                bad = ', '.join(
                    f"{axis}='{getattr(ref, axis)}'"
                    for axis, keys in valid.items()
                    if getattr(ref, axis, 'default') not in keys
                )
                if bad:
                    msg += (", " if msg else "") + f"{bad} [{ref}]"
        if msg:
            return msg

    x_range = Instance(Range, default=InstanceDefault(DataRange1d), help="""
    The (default) data range of the horizontal dimension of the plot.
    """)

    y_range = Instance(Range, default=InstanceDefault(DataRange1d), help="""
    The (default) data range of the vertical dimension of the plot.
    """)

    @classmethod
    def _scale(cls, scale: Literal["auto", "linear", "log", "categorical"]) -> Scale:
        if scale in ["auto", "linear"]:
            return LinearScale()
        elif scale == "log":
            return LogScale()
        if scale == "categorical":
            return CategoricalScale()
        else:
            raise ValueError(f"Unknown mapper_type: {scale}")

    x_scale = Instance(Scale, default=InstanceDefault(LinearScale), help="""
    What kind of scale to use to convert x-coordinates in data space
    into x-coordinates in screen space.
    """)

    y_scale = Instance(Scale, default=InstanceDefault(LinearScale), help="""
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

    extra_x_scales = Dict(String, Instance(Scale), help="""
    Additional named scales to make available for mapping x-coordinates.

    This is useful for adding additional axes.

    .. note:: This feature is experimental and may change in the short term.
    """)

    extra_y_scales = Dict(String, Instance(Scale), help="""
    Additional named scales to make available for mapping y-coordinates.

    This is useful for adding additional axes.

    .. note:: This feature is experimental and may change in the short term.
    """)

    hidpi = Bool(default=True, help="""
    Whether to use HiDPI mode when available.
    """)

    title = Either(Null, Instance(Title), default=InstanceDefault(Title, text=""), help="""
    A title for the plot. Can be a text string or a Title annotation.
    """).accepts(String, lambda text: Title(text=text))

    title_location = Nullable(Enum(Location), default="above", help="""
    Where the title will be located. Titles on the left or right side
    will be rotated.
    """)

    outline_props = Include(ScalarLineProps, prefix="outline", help="""
    The {prop} for the plot border outline.
    """)

    outline_line_color = Override(default="#e5e5e5")

    renderers = List(Instance(Renderer), help="""
    A list of all renderers for this plot, including guides and annotations
    in addition to glyphs.

    This property can be manipulated by hand, but the ``add_glyph`` and
    ``add_layout`` methods are recommended to help make sure all necessary
    setup is performed.
    """)

    toolbar = Instance(Toolbar, default=InstanceDefault(Toolbar), help="""
    The toolbar associated with this plot which holds all the tools. It is
    automatically created with the plot if necessary.
    """)

    toolbar_location = Nullable(Enum(Location), default="right", help="""
    Where the toolbar will be located. If set to None, no toolbar
    will be attached to the plot.
    """)

    toolbar_sticky = Bool(default=True, help="""
    Stick the toolbar to the edge of the plot. Default: True. If False,
    the toolbar will be outside of the axes, titles etc.
    """)

    toolbar_inner = Bool(default=False, help="""
    Locate the toolbar inside the frame. Setting this property to ``True``
    makes most sense with auto-hidden toolbars.
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

    center = List(Instance(Renderer), help="""
    A list of renderers to occupy the center area (frame) of the plot.
    """)

    width: int | None = Override(default=600)

    height: int | None = Override(default=600)

    frame_width = Nullable(Int, help="""
    The width of a plot frame or the inner width of a plot, excluding any
    axes, titles, border padding, etc.
    """)

    frame_height = Nullable(Int, help="""
    The height of a plot frame or the inner height of a plot, excluding any
    axes, titles, border padding, etc.
    """)

    frame_align = Either(Bool, LRTB(Optional(Bool)), default=True, help="""
    Allows to specify which frame edges to align in multiple-plot layouts.

    The default is to align all edges, but users can opt-out from alignment
    of each individual edge or all edges. Note also that other proproperties
    may disable alignment of certain edges, especially when using fixed frame
    size (``frame_width`` and ``frame_height`` properties).
    """)

    inner_width = Readonly(Int, help="""
    This is the exact width of the plotting canvas, i.e. the width of
    the actual plot, without toolbars etc. Note this is computed in a
    web browser, so this property will work only in backends capable of
    bidirectional communication (server, notebook).

    .. note::
        This is an experimental feature and the API may change in near future.

    """)

    inner_height = Readonly(Int, help="""
    This is the exact height of the plotting canvas, i.e. the height of
    the actual plot, without toolbars etc. Note this is computed in a
    web browser, so this property will work only in backends capable of
    bidirectional communication (server, notebook).

    .. note::
        This is an experimental feature and the API may change in near future.

    """)

    outer_width = Readonly(Int, help="""
    This is the exact width of the layout, i.e. the height of
    the actual plot, with toolbars etc. Note this is computed in a
    web browser, so this property will work only in backends capable of
    bidirectional communication (server, notebook).

    .. note::
        This is an experimental feature and the API may change in near future.

    """)

    outer_height = Readonly(Int, help="""
    This is the exact height of the layout, i.e. the height of
    the actual plot, with toolbars etc. Note this is computed in a
    web browser, so this property will work only in backends capable of
    bidirectional communication (server, notebook).

    .. note::
        This is an experimental feature and the API may change in near future.

    """)

    background_props = Include(ScalarFillProps, prefix="background", help="""
    The {prop} for the plot background style.
    """)

    background_fill_color = Override(default='#ffffff')

    border_props = Include(ScalarFillProps, prefix="border", help="""
    The {prop} for the plot border style.
    """)

    border_fill_color = Override(default='#ffffff')

    min_border_top = Nullable(Int, help="""
    Minimum size in pixels of the padding region above the top of the
    central plot region.

    .. note::
        This is a *minimum*. The padding region may expand as needed to
        accommodate titles or axes, etc.

    """)

    min_border_bottom = Nullable(Int, help="""
    Minimum size in pixels of the padding region below the bottom of
    the central plot region.

    .. note::
        This is a *minimum*. The padding region may expand as needed to
        accommodate titles or axes, etc.

    """)

    min_border_left = Nullable(Int, help="""
    Minimum size in pixels of the padding region to the left of
    the central plot region.

    .. note::
        This is a *minimum*. The padding region may expand as needed to
        accommodate titles or axes, etc.

    """)

    min_border_right = Nullable(Int, help="""
    Minimum size in pixels of the padding region to the right of
    the central plot region.

    .. note::
        This is a *minimum*. The padding region may expand as needed to
        accommodate titles or axes, etc.

    """)

    min_border = Nullable(Int, default=5, help="""
    A convenience property to set all all the ``min_border_X`` properties
    to the same value. If an individual border property is explicitly set,
    it will override ``min_border``.
    """)

    lod_factor = Int(10, help="""
    Decimation factor to use when applying level-of-detail decimation.
    """)

    lod_threshold = Nullable(Int, default=2000, help="""
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
    attempt to match the (width/height) of *data space* to the (width/height)
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
        plots. Doing so may result in undefined behavior.
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

    reset_policy = Enum(ResetPolicy, default="standard", help="""
    How a plot should respond to being reset. By deafult, the standard actions
    are to clear any tool state history, return plot ranges to their original
    values, undo all selections, and emit a ``Reset`` event. If customization
    is desired, this property may be set to ``"event_only"``, which will
    suppress all of the actions except the Reset event.
    """)

    hold_render = Bool(default=False, help="""
    When set to True all requests to repaint the plot will be hold off.

    This is useful when periodically updating many glyphs. For example, let's
    assume we have 10 lines on a plot, each with its own datasource. We stream
    to all of them every second in a for loop like so:

    .. code:: python

        for line in lines:
            line.stream(new_points())

    The problem with this code is that every stream triggers a re-rendering of
    the plot. Even tough repainting only on the last stream would produce almost
    identical visual effect. Especially for lines with many points this becomes
    computationally expensive and can freeze your browser. Using a convenience
    method `hold`, we can control when rendering is initiated like so:

    .. code:: python

        with plot.hold(render=True):
            for line in lines:
                line.stream(new_points())

    In this case we render newly appended points only after the last stream.
    """)

class GridPlot(LayoutDOM):
    """

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    toolbar = Instance(Toolbar, default=InstanceDefault(Toolbar), help="""
    The toolbar associated with this grid plot, which holds all the tools.
    It is automatically created with the plot if necessary.
    """)

    toolbar_location = Nullable(Enum(Location), default="above", help="""
    Indicates where the layout the toolbar will be located. If set to None,
    no toolbar will be attached to the grid plot.
    """)

    children = List(Either(
        Tuple(Instance(LayoutDOM), Int, Int),
        Tuple(Instance(LayoutDOM), Int, Int, Int, Int)), default=[], help="""
    A list of subplots with their associated position in the grid, row and column
    index and optional row and column spans (the defaul span is 1).
    """)

    rows = Nullable(TracksSizing, default="max-content", help="""
    Describes how the grid should maintain its rows' heights.
    """)

    cols = Nullable(TracksSizing, default="max-content", help="""
    Describes how the grid should maintain its columns' widths.
    """)

    spacing = Either(Int, Tuple(Int, Int), default=0, help="""
    The gap between children (in pixels).

    Either a number, if spacing is the same for both dimensions, or a pair
    of numbers indicating spacing in the vertical and horizontal dimensions
    respectively.
    """)

    @error(REPEATED_LAYOUT_CHILD)
    def _check_repeated_layout_children(self):
        children = [ child[0] for child in self.children ]
        if len(children) != len(set(children)):
            return str(self)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _check_conflicting_kwargs(a1, a2, kwargs):
    if a1 in kwargs and a2 in kwargs:
        raise ValueError("Conflicting properties set on plot: %r and %r" % (a1, a2))

class _list_attr_splat(list):
    def __setattr__(self, attr, value):
        for x in self:
            setattr(x, attr, value)
    def __getattribute__(self, attr):
        if attr in dir(list):
            return list.__getattribute__(self, attr)
        if len(self) == 0:
            raise AttributeError("Trying to access %r attribute on an empty 'splattable' list" % attr)
        if len(self) == 1:
            return getattr(self[0], attr)
        try:
            return _list_attr_splat([getattr(x, attr) for x in self])
        except Exception:
            raise AttributeError("Trying to access %r attribute on a 'splattable' list, but list items have no %r attribute" % (attr, attr))

    def __dir__(self):
        if len({type(x) for x in self}) == 1:
            return dir(self[0])
        else:
            return dir(self)

_LEGEND_EMPTY_WARNING = """
You are attempting to set `plot.legend.%s` on a plot that has zero legends added, this will have no effect.

Before legend properties can be set, you must add a Legend explicitly, or call a glyph method with a legend parameter set.
"""

class _legend_attr_splat(_list_attr_splat):
    def __setattr__(self, attr, value):
        if not len(self):
            warnings.warn(_LEGEND_EMPTY_WARNING % attr)
        return super().__setattr__(attr, value)

def _select_helper(args, kwargs):
    """ Allow flexible selector syntax.

    Returns:
        dict

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
        elif isinstance(arg, str):
            selector = dict(name=arg)
        elif isinstance(arg, type) and issubclass(arg, Model):
            selector = {"type": arg}
        else:
            raise TypeError("selector must be a dictionary, string or plot object.")

    elif 'selector' in kwargs:
        if len(kwargs) == 1:
            selector = kwargs['selector']
        else:
            raise TypeError("when passing 'selector' keyword arg, not other keyword args may be present")

    else:
        selector = kwargs

    return selector

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
