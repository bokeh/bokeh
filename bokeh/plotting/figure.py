#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

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
from typing import Any as TAny

# Bokeh imports
from ..core.enums import HorizontalLocation, MarkerType, VerticalLocation
from ..core.properties import (
    Any,
    Auto,
    Either,
    Enum,
    Instance,
    Int,
    List,
    Null,
    Nullable,
    Seq,
    String,
    TextLike,
    Tuple,
)
from ..models import (
    ColumnDataSource,
    CoordinateMapping,
    GraphRenderer,
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
from .glyph_api import _MARKER_SHORTCUTS, GlyphAPI

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#: A default set of tools configured if no configuration is provided
DEFAULT_TOOLS = "pan,wheel_zoom,box_zoom,save,reset,help"

__all__ = (
    'Figure',
    'figure',
    'markers',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Figure(Plot, GlyphAPI):
    ''' Create a new Figure for plotting.

    A subclass of |Plot| that simplifies plot creation with default axes, grids,
    tools, etc.

    Figure objects have many glyph methods that can be used to draw
    vectorized graphical glyphs:

    .. hlist::
        :columns: 3

        * :func:`~bokeh.plotting.Figure.annular_wedge`
        * :func:`~bokeh.plotting.Figure.annulus`
        * :func:`~bokeh.plotting.Figure.arc`
        * :func:`~bokeh.plotting.Figure.asterisk`
        * :func:`~bokeh.plotting.Figure.bezier`
        * :func:`~bokeh.plotting.Figure.circle`
        * :func:`~bokeh.plotting.Figure.circle_cross`
        * :func:`~bokeh.plotting.Figure.circle_dot`
        * :func:`~bokeh.plotting.Figure.circle_x`
        * :func:`~bokeh.plotting.Figure.circle_y`
        * :func:`~bokeh.plotting.Figure.cross`
        * :func:`~bokeh.plotting.Figure.dash`
        * :func:`~bokeh.plotting.Figure.diamond`
        * :func:`~bokeh.plotting.Figure.diamond_cross`
        * :func:`~bokeh.plotting.Figure.diamond_dot`
        * :func:`~bokeh.plotting.Figure.dot`
        * :func:`~bokeh.plotting.Figure.ellipse`
        * :func:`~bokeh.plotting.Figure.harea`
        * :func:`~bokeh.plotting.Figure.hbar`
        * :func:`~bokeh.plotting.Figure.hex`
        * :func:`~bokeh.plotting.Figure.hex_tile`
        * :func:`~bokeh.plotting.Figure.image`
        * :func:`~bokeh.plotting.Figure.image_rgba`
        * :func:`~bokeh.plotting.Figure.image_url`
        * :func:`~bokeh.plotting.Figure.inverted_triangle`
        * :func:`~bokeh.plotting.Figure.line`
        * :func:`~bokeh.plotting.Figure.multi_line`
        * :func:`~bokeh.plotting.Figure.multi_polygons`
        * :func:`~bokeh.plotting.Figure.oval`
        * :func:`~bokeh.plotting.Figure.patch`
        * :func:`~bokeh.plotting.Figure.patches`
        * :func:`~bokeh.plotting.Figure.plus`
        * :func:`~bokeh.plotting.Figure.quad`
        * :func:`~bokeh.plotting.Figure.quadratic`
        * :func:`~bokeh.plotting.Figure.ray`
        * :func:`~bokeh.plotting.Figure.rect`
        * :func:`~bokeh.plotting.Figure.segment`
        * :func:`~bokeh.plotting.Figure.square`
        * :func:`~bokeh.plotting.Figure.square_cross`
        * :func:`~bokeh.plotting.Figure.square_dot`
        * :func:`~bokeh.plotting.Figure.square_pin`
        * :func:`~bokeh.plotting.Figure.square_x`
        * :func:`~bokeh.plotting.Figure.star`
        * :func:`~bokeh.plotting.Figure.star_dot`
        * :func:`~bokeh.plotting.Figure.step`
        * :func:`~bokeh.plotting.Figure.text`
        * :func:`~bokeh.plotting.Figure.triangle`
        * :func:`~bokeh.plotting.Figure.triangle_dot`
        * :func:`~bokeh.plotting.Figure.triangle_pin`
        * :func:`~bokeh.plotting.Figure.varea`
        * :func:`~bokeh.plotting.Figure.vbar`
        * :func:`~bokeh.plotting.Figure.wedge`
        * :func:`~bokeh.plotting.Figure.x`
        * :func:`~bokeh.plotting.Figure.y`

    There is a scatter function that can be parameterized by marker type:

    * :func:`~bokeh.plotting.Figure.scatter`

    There are also specialized methods for stacking bars:

    * bars: :func:`~bokeh.plotting.Figure.hbar_stack`, :func:`~bokeh.plotting.Figure.vbar_stack`
    * lines: :func:`~bokeh.plotting.Figure.hline_stack`, :func:`~bokeh.plotting.Figure.vline_stack`
    * areas: :func:`~bokeh.plotting.Figure.harea_stack`, :func:`~bokeh.plotting.Figure.varea_stack`

    As well as one specialized method for making simple hexbin plots:

    * :func:`~bokeh.plotting.Figure.hexbin`

    In addition to all the ``Figure`` property attributes, the following
    options are also accepted:

    .. bokeh-options:: FigureOptions
        :module: bokeh.plotting.figure

    '''

    __subtype__ = "Figure"
    __view_model__ = "Plot"

    def __init__(self, *arg, **kw) -> None:
        opts = FigureOptions(kw)
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
                A NumPy array of y-coordinates to bin into hexagonal tiles

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

        Returns
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
            *2016* and *2017*, then the following call to ``harea_stack`` will
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
            *2016* and *2017*, then the following call to ``hbar_stack`` will
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
            stackers for the y-coordinates will will create two ``Line``
            renderers that stack:

            .. code-block:: python

                p.line_stack(['2016', '2017'], x='x', color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.line(y=stack('2016'),         x='x', color='blue', source=source, name='2016')
                p.line(y=stack('2016', '2017'), x='x', color='red',  source=source, name='2017')

        '''
        if all(isinstance(val, (list, tuple)) for val in (x,y)):
            raise ValueError("Only one of x or y may be a list of stackers")

        result = []

        if isinstance(y, (list, tuple)):
            kw['x'] = x
            for kw in single_stack(y, "y", **kw):
                result.append(self.line(**kw))
            return result

        if isinstance(x, (list, tuple)):
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
            stackers for the x-coordinates will will create two ``Line``
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
            *2016* and *2017*, then the following call to ``varea_stack`` will
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
            *2016* and *2017*, then the following call to ``vbar_stack`` will
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
            stackers for the y-coordinates will will create two ``Line``
            renderers that stack:

            .. code-block:: python

                p.vline_stack(['2016', '2017'], x='x', color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.line(y=stack('2016'),         x='x', color='blue', source=source, name='2016')
                p.line(y=stack('2016', '2017'), x='x', color='red',  source=source, name='2017')

        '''
        return self._line_stack(y=stackers, **kw)

    def graph(self, node_source, edge_source, layout_provider, **kwargs):
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

def figure(**kwargs: TAny) -> Figure:
    ''' Create a new :class:`~bokeh.plotting.Figure` for plotting.

    All other keyword arguments are passed to :class:`~bokeh.plotting.Figure`.

    Returns:
       :class:`~bokeh.plotting.Figure`

    '''
    return Figure(**kwargs)

def markers():
    ''' Prints a list of valid marker types for scatter()

    Returns:
        None
    '''
    print("Available markers: \n\n - " + "\n - ".join(list(MarkerType)))
    print()
    print("Shortcuts: \n\n" + "\n".join(" %r: %s" % item for item in _MARKER_SHORTCUTS.items()))

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

    active_drag = Either(Null, Auto, String, Instance(Drag), default="auto", help="""
    Which drag tool should initially be active.
    """)

    active_inspect = Either(Null, Auto, String, Instance(InspectTool), Seq(Instance(InspectTool)), default="auto", help="""
    Which drag tool should initially be active.
    """)

    active_scroll = Either(Null, Auto, String, Instance(Scroll), default="auto", help="""
    Which scroll tool should initially be active.
    """)

    active_tap = Either(Null, Auto, String, Instance(Tap), default="auto", help="""
    Which tap tool should initially be active.
    """)

    active_multi = Either(Null, Auto, String, Instance(GestureTool), default="auto", help="""
    Specify an active multi-gesture tool, for instance an edit tool or a range tool.
    """)

    tooltips = Either(Null, Instance(Template), String, List(Tuple(String, String)), help="""
    An optional argument to configure tooltips for the Figure. This argument
    accepts the same values as the ``HoverTool.tooltips`` property. If a hover
    tool is specified in the ``tools`` argument, this value will override that
    hover tools ``tooltips`` value. If no hover tool is specified in the
    ``tools`` argument, then passing tooltips here will cause one to be created
    and added.
    """)

class FigureOptions(BaseFigureOptions):

    x_range = Any(help="""
    Customize the x-range of the plot.
    """)

    y_range = Any(help="""
    Customize the y-range of the plot.
    """)

    x_axis_type = Either(Null, Auto, Enum("linear", "log", "datetime", "mercator"), default="auto", help="""
    The type of the x-axis.
    """)

    y_axis_type = Either(Null, Auto, Enum("linear", "log", "datetime", "mercator"), default="auto", help="""
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
