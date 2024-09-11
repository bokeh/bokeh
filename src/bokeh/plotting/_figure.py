#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
from typing import TYPE_CHECKING

import logging # isort:skip

log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
import numpy as np

# Bokeh imports
from ..core.enums import HorizontalLocation, MarkerType, VerticalLocation
from ..core.properties import (
    Auto,
    Datetime,
    Either,
    Enum,
    Float,
    Instance,
    InstanceDefault,
    Int,
    List,
    Nullable,
    Object,
    Seq,
    String,
    TextLike,
    TimeDelta,
    Tuple,
)
from ..models import (
    ColumnDataSource,
    CoordinateMapping,
    DataRange1d,
    GraphRenderer,
    LayoutProvider,
    Plot,
    Range,
    Scale,
    Tool,
)
from ..models.dom import Template
from ..models.tools import (
    Drag,
    GestureTool,
    InspectTool,
    Scroll,
    Tap,
)
from ..transform import linear_cmap
from ..util.options import Options
from ._graph import get_graph_kwargs
from ._plot import get_range, get_scale, process_axis_and_grid
from ._stack import double_stack, single_stack
from ._tools import process_active_tools, process_tools_arg
from .contour import ContourRenderer, from_contour
from .glyph_api import _MARKER_SHORTCUTS, GlyphAPI

if TYPE_CHECKING:
    from numpy.typing import ArrayLike

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#: A default set of tools configured if no configuration is provided
DEFAULT_TOOLS = "pan,wheel_zoom,box_zoom,save,reset,help"

__all__ = (
    'figure',
    'markers',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class figure(Plot, GlyphAPI):
    ''' Create a new figure for plotting.

    A subclass of |Plot| that simplifies plot creation with default axes, grids,
    tools, etc.

    Figure objects have many glyph methods that can be used to draw
    vectorized graphical glyphs:

    .. hlist::
        :columns: 3

        * :func:`~bokeh.plotting.figure.annular_wedge`
        * :func:`~bokeh.plotting.figure.annulus`
        * :func:`~bokeh.plotting.figure.arc`
        * :func:`~bokeh.plotting.figure.asterisk`
        * :func:`~bokeh.plotting.figure.bezier`
        * :func:`~bokeh.plotting.figure.circle`
        * :func:`~bokeh.plotting.figure.circle_cross`
        * :func:`~bokeh.plotting.figure.circle_dot`
        * :func:`~bokeh.plotting.figure.circle_x`
        * :func:`~bokeh.plotting.figure.circle_y`
        * :func:`~bokeh.plotting.figure.cross`
        * :func:`~bokeh.plotting.figure.dash`
        * :func:`~bokeh.plotting.figure.diamond`
        * :func:`~bokeh.plotting.figure.diamond_cross`
        * :func:`~bokeh.plotting.figure.diamond_dot`
        * :func:`~bokeh.plotting.figure.dot`
        * :func:`~bokeh.plotting.figure.ellipse`
        * :func:`~bokeh.plotting.figure.harea`
        * :func:`~bokeh.plotting.figure.harea_step`
        * :func:`~bokeh.plotting.figure.hbar`
        * :func:`~bokeh.plotting.figure.hex`
        * :func:`~bokeh.plotting.figure.hex_tile`
        * :func:`~bokeh.plotting.figure.hstrip`
        * :func:`~bokeh.plotting.figure.hspan`
        * :func:`~bokeh.plotting.figure.image`
        * :func:`~bokeh.plotting.figure.image_rgba`
        * :func:`~bokeh.plotting.figure.image_url`
        * :func:`~bokeh.plotting.figure.inverted_triangle`
        * :func:`~bokeh.plotting.figure.line`
        * :func:`~bokeh.plotting.figure.multi_line`
        * :func:`~bokeh.plotting.figure.multi_polygons`
        * :func:`~bokeh.plotting.figure.ngon`
        * :func:`~bokeh.plotting.figure.patch`
        * :func:`~bokeh.plotting.figure.patches`
        * :func:`~bokeh.plotting.figure.plus`
        * :func:`~bokeh.plotting.figure.quad`
        * :func:`~bokeh.plotting.figure.quadratic`
        * :func:`~bokeh.plotting.figure.ray`
        * :func:`~bokeh.plotting.figure.rect`
        * :func:`~bokeh.plotting.figure.segment`
        * :func:`~bokeh.plotting.figure.square`
        * :func:`~bokeh.plotting.figure.square_cross`
        * :func:`~bokeh.plotting.figure.square_dot`
        * :func:`~bokeh.plotting.figure.square_pin`
        * :func:`~bokeh.plotting.figure.square_x`
        * :func:`~bokeh.plotting.figure.star`
        * :func:`~bokeh.plotting.figure.star_dot`
        * :func:`~bokeh.plotting.figure.step`
        * :func:`~bokeh.plotting.figure.text`
        * :func:`~bokeh.plotting.figure.triangle`
        * :func:`~bokeh.plotting.figure.triangle_dot`
        * :func:`~bokeh.plotting.figure.triangle_pin`
        * :func:`~bokeh.plotting.figure.varea`
        * :func:`~bokeh.plotting.figure.varea_step`
        * :func:`~bokeh.plotting.figure.vbar`
        * :func:`~bokeh.plotting.figure.vstrip`
        * :func:`~bokeh.plotting.figure.vspan`
        * :func:`~bokeh.plotting.figure.wedge`
        * :func:`~bokeh.plotting.figure.x`
        * :func:`~bokeh.plotting.figure.y`

    There is a scatter function that can be parameterized by marker type:

    * :func:`~bokeh.plotting.figure.scatter`

    There are also specialized methods for stacking bars:

    * bars: :func:`~bokeh.plotting.figure.hbar_stack`, :func:`~bokeh.plotting.figure.vbar_stack`
    * lines: :func:`~bokeh.plotting.figure.hline_stack`, :func:`~bokeh.plotting.figure.vline_stack`
    * areas: :func:`~bokeh.plotting.figure.harea_stack`, :func:`~bokeh.plotting.figure.varea_stack`

    As well as one specialized method for making simple hexbin plots:

    * :func:`~bokeh.plotting.figure.hexbin`

    In addition to all the ``figure`` property attributes, the following
    options are also accepted:

    .. bokeh-options:: FigureOptions
        :module: bokeh.plotting._figure

    '''

    __view_model__ = "Figure"

    def __init__(self, *arg, **kw) -> None:
        opts = FigureOptions(kw)

        names = self.properties()
        for name in kw.keys():
            if name not in names:
                self._raise_attribute_error_with_matches(name, names | opts.properties())

        super().__init__(*arg, **kw)

        self.x_range = get_range(opts.x_range)
        self.y_range = get_range(opts.y_range)

        self.x_scale = get_scale(self.x_range, opts.x_axis_type)
        self.y_scale = get_scale(self.y_range, opts.y_axis_type)

        process_axis_and_grid(self, opts.x_axis_type, opts.x_axis_location, opts.x_minor_ticks, opts.x_axis_label, self.x_range, 0)
        process_axis_and_grid(self, opts.y_axis_type, opts.y_axis_location, opts.y_minor_ticks, opts.y_axis_label, self.y_range, 1)

        tool_objs, tool_map = process_tools_arg(self, opts.tools, opts.tooltips)
        self.add_tools(*tool_objs)
        process_active_tools(
            self.toolbar,
            tool_map,
            opts.active_drag,
            opts.active_inspect,
            opts.active_scroll,
            opts.active_tap,
            opts.active_multi,
        )

    @property
    def plot(self):
        return self

    @property
    def coordinates(self):
        return None

    def subplot(self,
            *,
            x_source: Range | None = None, y_source: Range | None = None,
            x_scale: Scale | None = None, y_scale: Scale | None = None,
            x_target: Range, y_target: Range,
        ) -> GlyphAPI:
        """ Create a new sub-coordinate system and expose a plotting API. """
        coordinates = CoordinateMapping(x_source=x_source, y_source=y_source, x_target=x_target, y_target=y_target)
        return GlyphAPI(self, coordinates)

    def hexbin(self, x, y, size, orientation="pointytop", palette="Viridis256", line_color=None, fill_color=None, aspect_scale=1, **kwargs):
        ''' Perform a simple equal-weight hexagonal binning.

        A :class:`~bokeh.models.glyphs.HexTile` glyph will be added to display
        the binning. The :class:`~bokeh.models.sources.ColumnDataSource` for
        the glyph will have columns ``q``, ``r``, and ``count``, where ``q``
        and ``r`` are `axial coordinates`_ for a tile, and ``count`` is the
        associated bin count.

        It is often useful to set ``match_aspect=True`` on the associated plot,
        so that hexagonal tiles are all regular (i.e. not "stretched") in
        screen space.

        For more sophisticated use-cases, e.g. weighted binning or individually
        scaling hex tiles, use :func:`hex_tile` directly, or consider a higher
        level library such as HoloViews.

        Args:
            x (array[float]) :
                A NumPy array of x-coordinates to bin into hexagonal tiles.

            y (array[float]) :
                A NumPy array of y-coordinates to bin into hexagonal tiles.

            size (float) :
                The size of the hexagonal tiling to use. The size is defined as
                distance from the center of a hexagon to a corner.

                In case the aspect scaling is not 1-1, then specifically `size`
                is the distance from the center to the "top" corner with the
                `"pointytop"` orientation, and the distance from the center to
                a "side" corner with the "flattop" orientation.

            orientation ("pointytop" or "flattop", optional) :
                Whether the hexagonal tiles should be oriented with a pointed
                corner on top, or a flat side on top. (default: "pointytop")

            palette (str or seq[color], optional) :
                A palette (or palette name) to use to colormap the bins according
                to count. (default: 'Viridis256')

                If ``fill_color`` is supplied, it overrides this value.

            line_color (color, optional) :
                The outline color for hex tiles, or None (default: None)

            fill_color (color, optional) :
                An optional fill color for hex tiles, or None. If None, then
                the ``palette`` will be used to color map the tiles by
                count. (default: None)

            aspect_scale (float) :
                Match a plot's aspect ratio scaling.

                When working with a plot with ``aspect_scale != 1``, this
                parameter can be set to match the plot, in order to draw
                regular hexagons (instead of "stretched" ones).

                This is roughly equivalent to binning in "screen space", and
                it may be better to use axis-aligned rectangular bins when
                plot aspect scales are not one.

        Any additional keyword arguments are passed to :func:`hex_tile`.

        Returns:
            (Glyphrender, DataFrame)
                A tuple with the ``HexTile`` renderer generated to display the
                binning, and a Pandas ``DataFrame`` with columns ``q``, ``r``,
                and ``count``, where ``q`` and ``r`` are `axial coordinates`_
                for a tile, and ``count`` is the associated bin count.

        Example:

            .. bokeh-plot::
                :source-position: above

                import numpy as np
                from bokeh.models import HoverTool
                from bokeh.plotting import figure, show

                x = 2 + 2*np.random.standard_normal(500)
                y = 2 + 2*np.random.standard_normal(500)

                p = figure(match_aspect=True, tools="wheel_zoom,reset")
                p.background_fill_color = '#440154'
                p.grid.visible = False

                p.hexbin(x, y, size=0.5, hover_color="pink", hover_alpha=0.8)

                hover = HoverTool(tooltips=[("count", "@c"), ("(q,r)", "(@q, @r)")])
                p.add_tools(hover)

                show(p)

        .. _axial coordinates: https://www.redblobgames.com/grids/hexagons/#coordinates-axial

        '''
        from ..util.hex import hexbin

        bins = hexbin(x, y, size, orientation, aspect_scale=aspect_scale)

        if fill_color is None:
            fill_color = linear_cmap('c', palette, 0, max(bins.counts))

        source = ColumnDataSource(data=dict(q=bins.q, r=bins.r, c=bins.counts))

        r = self.hex_tile(q="q", r="r", size=size, orientation=orientation, aspect_scale=aspect_scale,
                          source=source, line_color=line_color, fill_color=fill_color, **kwargs)

        return (r, bins)

    def harea_stack(self, stackers, **kw):
        ''' Generate multiple ``HArea`` renderers for levels stacked left
        to right.

        Args:
            stackers (seq[str]) : a list of data source field names to stack
                successively for ``x1`` and ``x2`` harea coordinates.

                Additionally, the ``name`` of the renderer will be set to
                the value of each successive stacker (this is useful with the
                special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``harea``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2016* and *2017*, then the following call to ``harea_stack``
            will create two ``HArea`` renderers that stack:

            .. code-block:: python

                p.harea_stack(['2016', '2017'], y='y', color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.harea(x1=stack(),       x2=stack('2016'),         y='y', color='blue', source=source, name='2016')
                p.harea(x1=stack('2016'), x2=stack('2016', '2017'), y='y', color='red',  source=source, name='2017')

        '''
        result = []
        for kw in double_stack(stackers, "x1", "x2", **kw):
            result.append(self.harea(**kw))
        return result

    def hbar_stack(self, stackers, **kw):
        ''' Generate multiple ``HBar`` renderers for levels stacked left to right.

        Args:
            stackers (seq[str]) : a list of data source field names to stack
                successively for ``left`` and ``right`` bar coordinates.

                Additionally, the ``name`` of the renderer will be set to
                the value of each successive stacker (this is useful with the
                special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``hbar``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2016* and *2017*, then the following call to ``hbar_stack``
            will create two ``HBar`` renderers that stack:

            .. code-block:: python

                p.hbar_stack(['2016', '2017'], y=10, width=0.9, color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.hbar(bottom=stack(),       top=stack('2016'),         y=10, width=0.9, color='blue', source=source, name='2016')
                p.hbar(bottom=stack('2016'), top=stack('2016', '2017'), y=10, width=0.9, color='red',  source=source, name='2017')

        '''
        result = []
        for kw in double_stack(stackers, "left", "right", **kw):
            result.append(self.hbar(**kw))
        return result

    def _line_stack(self, x, y, **kw):
        ''' Generate multiple ``Line`` renderers for lines stacked vertically
        or horizontally.

        Args:
            x (seq[str]) :

            y (seq[str]) :

        Additionally, the ``name`` of the renderer will be set to
        the value of each successive stacker (this is useful with the
        special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``hbar``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2016* and *2017*, then the following call to ``line_stack`` with
            stackers for the y-coordinates will create two ``Line``
            renderers that stack:

            .. code-block:: python

                p.line_stack(['2016', '2017'], x='x', color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.line(y=stack('2016'),         x='x', color='blue', source=source, name='2016')
                p.line(y=stack('2016', '2017'), x='x', color='red',  source=source, name='2017')

        '''
        if all(isinstance(val, list | tuple) for val in (x,y)):
            raise ValueError("Only one of x or y may be a list of stackers")

        result = []

        if isinstance(y, list | tuple):
            kw['x'] = x
            for kw in single_stack(y, "y", **kw):
                result.append(self.line(**kw))
            return result

        if isinstance(x, list | tuple):
            kw['y'] = y
            for kw in single_stack(x, "x", **kw):
                result.append(self.line(**kw))
            return result

        return [self.line(x, y, **kw)]

    def hline_stack(self, stackers, **kw):
        ''' Generate multiple ``Line`` renderers for lines stacked horizontally.

        Args:
            stackers (seq[str]) : a list of data source field names to stack
                successively for ``x`` line coordinates.

        Additionally, the ``name`` of the renderer will be set to
        the value of each successive stacker (this is useful with the
        special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``line``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2016* and *2017*, then the following call to ``hline_stack`` with
            stackers for the x-coordinates will create two ``Line``
            renderers that stack:

            .. code-block:: python

                p.hline_stack(['2016', '2017'], y='y', color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.line(x=stack('2016'),         y='y', color='blue', source=source, name='2016')
                p.line(x=stack('2016', '2017'), y='y', color='red',  source=source, name='2017')

        '''
        return self._line_stack(x=stackers, **kw)

    def varea_stack(self, stackers, **kw):
        ''' Generate multiple ``VArea`` renderers for levels stacked bottom
        to top.

        Args:
            stackers (seq[str]) : a list of data source field names to stack
                successively for ``y1`` and ``y1`` varea coordinates.

                Additionally, the ``name`` of the renderer will be set to
                the value of each successive stacker (this is useful with the
                special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``varea``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2016* and *2017*, then the following call to ``varea_stack``
            will create two ``VArea`` renderers that stack:

            .. code-block:: python

                p.varea_stack(['2016', '2017'], x='x', color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.varea(y1=stack(),       y2=stack('2016'),         x='x', color='blue', source=source, name='2016')
                p.varea(y1=stack('2016'), y2=stack('2016', '2017'), x='x', color='red',  source=source, name='2017')

        '''
        result = []
        for kw in double_stack(stackers, "y1", "y2", **kw):
            result.append(self.varea(**kw))
        return result

    def vbar_stack(self, stackers, **kw):
        ''' Generate multiple ``VBar`` renderers for levels stacked bottom
        to top.

        Args:
            stackers (seq[str]) : a list of data source field names to stack
                successively for ``left`` and ``right`` bar coordinates.

                Additionally, the ``name`` of the renderer will be set to
                the value of each successive stacker (this is useful with the
                special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``vbar``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2016* and *2017*, then the following call to ``vbar_stack``
            will create two ``VBar`` renderers that stack:

            .. code-block:: python

                p.vbar_stack(['2016', '2017'], x=10, width=0.9, color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.vbar(bottom=stack(),       top=stack('2016'),         x=10, width=0.9, color='blue', source=source, name='2016')
                p.vbar(bottom=stack('2016'), top=stack('2016', '2017'), x=10, width=0.9, color='red',  source=source, name='2017')

        '''
        result = []
        for kw in double_stack(stackers, "bottom", "top", **kw):
            result.append(self.vbar(**kw))
        return result

    def vline_stack(self, stackers, **kw):
        ''' Generate multiple ``Line`` renderers for lines stacked vertically.

        Args:
            stackers (seq[str]) : a list of data source field names to stack
                successively for ``y`` line coordinates.

        Additionally, the ``name`` of the renderer will be set to
        the value of each successive stacker (this is useful with the
        special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``line``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2016* and *2017*, then the following call to ``vline_stack`` with
            stackers for the y-coordinates will create two ``Line``
            renderers that stack:

            .. code-block:: python

                p.vline_stack(['2016', '2017'], x='x', color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.line(y=stack('2016'),         x='x', color='blue', source=source, name='2016')
                p.line(y=stack('2016', '2017'), x='x', color='red',  source=source, name='2017')

        '''
        return self._line_stack(y=stackers, **kw)

    def graph(self, node_source: ColumnDataSource, edge_source: ColumnDataSource, layout_provider: LayoutProvider, **kwargs):
        ''' Creates a network graph using the given node, edge and layout provider.

        Args:
            node_source (:class:`~bokeh.models.sources.ColumnDataSource`) : a user-supplied data source
                for the graph nodes. An attempt will be made to convert the object to
                :class:`~bokeh.models.sources.ColumnDataSource` if needed. If none is supplied, one is created
                for the user automatically.

            edge_source (:class:`~bokeh.models.sources.ColumnDataSource`) : a user-supplied data source
                for the graph edges. An attempt will be made to convert the object to
                :class:`~bokeh.models.sources.ColumnDataSource` if needed. If none is supplied, one is created
                for the user automatically.

            layout_provider (:class:`~bokeh.models.graphs.LayoutProvider`) : a ``LayoutProvider`` instance to
                provide the graph coordinates in Cartesian space.

            **kwargs: |line properties| and |fill properties|

        '''
        kw = get_graph_kwargs(node_source, edge_source, **kwargs)
        graph_renderer = GraphRenderer(layout_provider=layout_provider, **kw)
        self.renderers.append(graph_renderer)
        return graph_renderer

    def contour(
        self,
        x: ArrayLike | None = None,
        y: ArrayLike | None = None,
        z: ArrayLike | np.ma.MaskedArray | None = None,
        levels: ArrayLike | None = None,
        **visuals,
    ) -> ContourRenderer:
        ''' Creates a contour plot of filled polygons and/or contour lines.

        Filled contour polygons are calculated if ``fill_color`` is set,
        contour lines if ``line_color`` is set.

        Args:
            x (array-like[float] of shape (ny, nx) or (nx,), optional) :
                The x-coordinates of the ``z`` values. May be 2D with the same
                shape as ``z.shape``, or 1D with length ``nx = z.shape[1]``.
                If not specified are assumed to be ``np.arange(nx)``. Must be
                ordered monotonically.

            y (array-like[float] of shape (ny, nx) or (ny,), optional) :
                The y-coordinates of the ``z`` values. May be 2D with the same
                shape as ``z.shape``, or 1D with length ``ny = z.shape[0]``.
                If not specified are assumed to be ``np.arange(ny)``. Must be
                ordered monotonically.

            z (array-like[float] of shape (ny, nx)) :
                A 2D NumPy array of gridded values to calculate the contours
                of.  It may be a masked array, and any invalid values (``np.inf``
                or ``np.nan``) will also be masked out.

            levels (array-like[float]) :
                The z-levels to calculate the contours at, must be increasing.
                Contour lines are calculated at each level and filled contours
                are calculated between each adjacent pair of levels so the
                number of sets of contour lines is ``len(levels)`` and the
                number of sets of filled contour polygons is ``len(levels)-1``.

            **visuals: |fill properties|, |hatch properties| and |line properties|
                Fill and hatch properties are used for filled contours, line
                properties for line contours. If using vectorized properties
                then the correct number must be used, ``len(levels)`` for line
                properties and ``len(levels)-1`` for fill and hatch properties.

                ``fill_color`` and ``line_color`` are more flexible in that
                they will accept longer sequences and interpolate them to the
                required number using :func:`~bokeh.palettes.linear_palette`,
                and also accept palette collections (dictionaries mapping from
                integer length to color sequence) such as
                `bokeh.palettes.Cividis`.

        '''
        contour_renderer = from_contour(x, y, z, levels, **visuals)
        self.renderers.append(contour_renderer)
        return contour_renderer

def markers():
    ''' Prints a list of valid marker types for scatter()

    Returns:
        None
    '''
    print("Available markers: \n\n - " + "\n - ".join(list(MarkerType)))
    print()
    print("Shortcuts: \n\n" + "\n".join(f" {short!r}: {name}" for (short, name) in _MARKER_SHORTCUTS.items()))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

# This class itself is intentionally undocumented (it is used to generate
# documentation elsewhere)
class BaseFigureOptions(Options):

    tools = Either(String, Seq(Either(String, Instance(Tool))), default=DEFAULT_TOOLS, help="""
    Tools the plot should start with.
    """)

    x_minor_ticks = Either(Auto, Int, default="auto", help="""
    Number of minor ticks between adjacent x-axis major ticks.
    """)

    y_minor_ticks = Either(Auto, Int, default="auto", help="""
    Number of minor ticks between adjacent y-axis major ticks.
    """)

    x_axis_location = Nullable(Enum(VerticalLocation), default="below", help="""
    Where the x-axis should be located.
    """)

    y_axis_location = Nullable(Enum(HorizontalLocation), default="left", help="""
    Where the y-axis should be located.
    """)

    x_axis_label = Nullable(TextLike, default="", help="""
    A label for the x-axis.
    """)

    y_axis_label = Nullable(TextLike, default="", help="""
    A label for the y-axis.
    """)

    active_drag = Nullable(Either(Auto, String, Instance(Drag)), default="auto", help="""
    Which drag tool should initially be active.
    """)

    active_inspect = Nullable(Either(Auto, String, Instance(InspectTool), Seq(Instance(InspectTool))), default="auto", help="""
    Which drag tool should initially be active.
    """)

    active_scroll = Nullable(Either(Auto, String, Instance(Scroll)), default="auto", help="""
    Which scroll tool should initially be active.
    """)

    active_tap = Nullable(Either(Auto, String, Instance(Tap)), default="auto", help="""
    Which tap tool should initially be active.
    """)

    active_multi = Nullable(Either(Auto, String, Instance(GestureTool)), default="auto", help="""
    Specify an active multi-gesture tool, for instance an edit tool or a range tool.
    """)

    tooltips = Nullable(Either(Instance(Template), String, List(Tuple(String, String))), help="""
    An optional argument to configure tooltips for the Figure. This argument
    accepts the same values as the ``HoverTool.tooltips`` property. If a hover
    tool is specified in the ``tools`` argument, this value will override that
    hover tools ``tooltips`` value. If no hover tool is specified in the
    ``tools`` argument, then passing tooltips here will cause one to be created
    and added.
    """)

RangeLike = Either(
    Instance(Range),
    Either(
        Tuple(Float, Float),
        Tuple(Datetime, Datetime),
        Tuple(TimeDelta, TimeDelta),
    ),
    Seq(String),
    Object("pandas.Series"),
    Object("pandas.core.groupby.GroupBy"),
)

AxisType = Nullable(Either(Auto, Enum("linear", "log", "datetime", "mercator")))

class FigureOptions(BaseFigureOptions):

    x_range = RangeLike(default=InstanceDefault(DataRange1d), help="""
    Customize the x-range of the plot.
    """)

    y_range = RangeLike(default=InstanceDefault(DataRange1d), help="""
    Customize the y-range of the plot.
    """)

    x_axis_type = AxisType(default="auto", help="""
    The type of the x-axis.
    """)

    y_axis_type = AxisType(default="auto", help="""
    The type of the y-axis.
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_color_fields = {"color", "fill_color", "line_color"}
_alpha_fields = {"alpha", "fill_alpha", "line_alpha"}

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
