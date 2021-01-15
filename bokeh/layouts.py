#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Functions for arranging bokeh layout objects.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import math
from collections import namedtuple

# Bokeh imports
from .core.enums import Location
from .models.layouts import Box, Column, GridBox, LayoutDOM, Row, Spacer, WidgetBox
from .models.plots import Plot
from .models.tools import ProxyToolbar, ToolbarBox

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'column',
    'grid',
    'gridplot',
    'GridSpec',
    'layout',
    'row',
    'Spacer',
    'widgetbox',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def row(*args, **kwargs):
    """ Create a row of Bokeh Layout objects. Forces all objects to
    have the same sizing_mode, which is required for complex layouts to work.

    Args:
        children (list of :class:`~bokeh.models.layouts.LayoutDOM` ): A list of instances for
            the row. Can be any of the following - :class:`~bokeh.models.plots.Plot`,
            :class:`~bokeh.models.widgets.widget.Widget`,
            :class:`~bokeh.models.layouts.Row`,
            :class:`~bokeh.models.layouts.Column`,
            :class:`~bokeh.models.tools.ToolbarBox`,
            :class:`~bokeh.models.layouts.Spacer`.

        sizing_mode (``"fixed"``, ``"stretch_both"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"`` ): How
            will the items in the layout resize to fill the available space.
            Default is ``"fixed"``. For more information on the different
            modes see :attr:`~bokeh.models.layouts.LayoutDOM.sizing_mode`
            description on :class:`~bokeh.models.layouts.LayoutDOM`.

    Returns:
        Row: A row of LayoutDOM objects all with the same sizing_mode.

    Examples:

        >>> row(plot1, plot2)
        >>> row(children=[widgets, plot], sizing_mode='stretch_both')
    """

    sizing_mode = kwargs.pop('sizing_mode', None)
    children = kwargs.pop('children', None)

    children = _parse_children_arg(*args, children=children)

    _handle_child_sizing(children, sizing_mode, widget="row")

    return Row(children=children, sizing_mode=sizing_mode, **kwargs)


def column(*args, **kwargs):
    """ Create a column of Bokeh Layout objects. Forces all objects to
    have the same sizing_mode, which is required for complex layouts to work.

    Args:
        children (list of :class:`~bokeh.models.layouts.LayoutDOM` ): A list of instances for
            the column. Can be any of the following - :class:`~bokeh.models.plots.Plot`,
            :class:`~bokeh.models.widgets.widget.Widget`,
            :class:`~bokeh.models.layouts.Row`,
            :class:`~bokeh.models.layouts.Column`,
            :class:`~bokeh.models.tools.ToolbarBox`,
            :class:`~bokeh.models.layouts.Spacer`.

        sizing_mode (``"fixed"``, ``"stretch_both"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"`` ): How
            will the items in the layout resize to fill the available space.
            Default is ``"fixed"``. For more information on the different
            modes see :attr:`~bokeh.models.layouts.LayoutDOM.sizing_mode`
            description on :class:`~bokeh.models.layouts.LayoutDOM`.

    Returns:
        Column: A column of LayoutDOM objects all with the same sizing_mode.

    Examples:

        >>> column(plot1, plot2)
        >>> column(children=[widgets, plot], sizing_mode='stretch_both')
    """

    sizing_mode = kwargs.pop('sizing_mode', None)
    children = kwargs.pop('children', None)

    children = _parse_children_arg(*args, children=children)

    _handle_child_sizing(children, sizing_mode, widget="column")

    return Column(children=children, sizing_mode=sizing_mode, **kwargs)


def widgetbox(*args, **kwargs):
    """ Create a column of bokeh widgets with predefined styling.

    Args:
        children (list of :class:`~bokeh.models.widgets.widget.Widget`): A list of widgets.

        sizing_mode (``"fixed"``, ``"stretch_both"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"`` ): How
            will the items in the layout resize to fill the available space.
            Default is ``"fixed"``. For more information on the different
            modes see :attr:`~bokeh.models.layouts.LayoutDOM.sizing_mode`
            description on :class:`~bokeh.models.layouts.LayoutDOM`.

    Returns:
        WidgetBox: A column layout of widget instances all with the same ``sizing_mode``.

    Examples:

        >>> widgetbox([button, select])
        >>> widgetbox(children=[slider], sizing_mode='scale_width')
    """

    sizing_mode = kwargs.pop('sizing_mode', None)
    children = kwargs.pop('children', None)

    children = _parse_children_arg(*args, children=children)

    _handle_child_sizing(children, sizing_mode, widget="widget box")

    return WidgetBox(children=children, sizing_mode=sizing_mode, **kwargs)


def layout(*args, **kwargs):
    """ Create a grid-based arrangement of Bokeh Layout objects.

    Args:
        children (list of lists of :class:`~bokeh.models.layouts.LayoutDOM` ): A list of lists of instances
            for a grid layout. Can be any of the following - :class:`~bokeh.models.plots.Plot`,
            :class:`~bokeh.models.widgets.widget.Widget`,
            :class:`~bokeh.models.layouts.Row`,
            :class:`~bokeh.models.layouts.Column`,
            :class:`~bokeh.models.tools.ToolbarBox`,
            :class:`~bokeh.models.layouts.Spacer`.

        sizing_mode (``"fixed"``, ``"stretch_both"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"`` ): How
            will the items in the layout resize to fill the available space.
            Default is ``"fixed"``. For more information on the different
            modes see :attr:`~bokeh.models.layouts.LayoutDOM.sizing_mode`
            description on :class:`~bokeh.models.layouts.LayoutDOM`.

    Returns:
        Column: A column of ``Row`` layouts of the children, all with the same sizing_mode.

    Examples:

        >>> layout([[plot_1, plot_2], [plot_3, plot_4]])
        >>> layout(
                children=[
                    [widget_1, plot_1],
                    [slider],
                    [widget_2, plot_2, plot_3]
                ],
                sizing_mode='fixed',
            )

    """
    sizing_mode = kwargs.pop('sizing_mode', None)
    children = kwargs.pop('children', None)

    children = _parse_children_arg(*args, children=children)

    # Make the grid
    return _create_grid(children, sizing_mode, **kwargs)

def gridplot(children, sizing_mode=None, toolbar_location='above', ncols=None,
             plot_width=None, plot_height=None, toolbar_options=None, merge_tools=True):
    ''' Create a grid of plots rendered on separate canvases.

    The ``gridplot`` function builds a single toolbar for all the plots in the
    grid. ``gridplot`` is designed to layout a set of plots. For general
    grid layout, use the :func:`~bokeh.layouts.layout` function.

    Args:
        children (list of lists of :class:`~bokeh.models.plots.Plot` ): An
            array of plots to display in a grid, given as a list of lists of Plot
            objects. To leave a position in the grid empty, pass None for that
            position in the children list. OR list of :class:`~bokeh.models.plots.Plot` if called with
            ncols. OR an instance of GridSpec.

        sizing_mode (``"fixed"``, ``"stretch_both"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"`` ): How
            will the items in the layout resize to fill the available space.
            Default is ``"fixed"``. For more information on the different
            modes see :attr:`~bokeh.models.layouts.LayoutDOM.sizing_mode`
            description on :class:`~bokeh.models.layouts.LayoutDOM`.

        toolbar_location (``above``, ``below``, ``left``, ``right`` ): Where the
            toolbar will be located, with respect to the grid. Default is
            ``above``. If set to None, no toolbar will be attached to the grid.

        ncols (int, optional): Specify the number of columns you would like in your grid.
            You must only pass an un-nested list of plots (as opposed to a list of lists of plots)
            when using ncols.

        plot_width (int, optional): The width you would like all your plots to be

        plot_height (int, optional): The height you would like all your plots to be.

        toolbar_options (dict, optional) : A dictionary of options that will be
            used to construct the grid's toolbar (an instance of
            :class:`~bokeh.models.tools.ToolbarBox`). If none is supplied,
            ToolbarBox's defaults will be used.

        merge_tools (``True``, ``False``): Combine tools from all child plots into
            a single toolbar.

    Returns:
        Row or Column: A row or column containing the grid toolbar and the grid
            of plots (depending on whether the toolbar is left/right or
            above/below. The grid is always a Column of Rows of plots.

    Examples:

        >>> gridplot([[plot_1, plot_2], [plot_3, plot_4]])
        >>> gridplot([plot_1, plot_2, plot_3, plot_4], ncols=2, plot_width=200, plot_height=100)
        >>> gridplot(
                children=[[plot_1, plot_2], [None, plot_3]],
                toolbar_location='right'
                sizing_mode='fixed',
                toolbar_options=dict(logo='gray')
            )

    '''
    if toolbar_options is None:
        toolbar_options = {}

    if toolbar_location:
        if not hasattr(Location, toolbar_location):
            raise ValueError("Invalid value of toolbar_location: %s" % toolbar_location)

    children = _parse_children_arg(children=children)
    if ncols:
        if any(isinstance(child, list) for child in children):
            raise ValueError("Cannot provide a nested list when using ncols")
        children = list(_chunks(children, ncols))

    # Additional children set-up for grid plot
    if not children:
        children = []

    # Make the grid
    toolbars = []
    items = []

    for y, row in enumerate(children):
        for x, item in enumerate(row):
            if item is None:
                continue
            elif isinstance(item, LayoutDOM):
                if merge_tools:
                    for plot in item.select(dict(type=Plot)):
                        toolbars.append(plot.toolbar)
                        plot.toolbar_location = None

                if isinstance(item, Plot):
                    if plot_width is not None:
                        item.plot_width = plot_width
                    if plot_height is not None:
                        item.plot_height = plot_height

                if sizing_mode is not None and _has_auto_sizing(item):
                    item.sizing_mode = sizing_mode

                items.append((item, y, x))
            else:
                raise ValueError("Only LayoutDOM items can be inserted into a grid")

    if not merge_tools or not toolbar_location:
        return GridBox(children=items, sizing_mode=sizing_mode)

    grid = GridBox(children=items)
    tools = sum([ toolbar.tools for toolbar in toolbars ], [])
    proxy = ProxyToolbar(toolbars=toolbars, tools=tools, **toolbar_options)
    toolbar = ToolbarBox(toolbar=proxy, toolbar_location=toolbar_location)

    if toolbar_location == 'above':
        return Column(children=[toolbar, grid], sizing_mode=sizing_mode)
    elif toolbar_location == 'below':
        return Column(children=[grid, toolbar], sizing_mode=sizing_mode)
    elif toolbar_location == 'left':
        return Row(children=[toolbar, grid], sizing_mode=sizing_mode)
    elif toolbar_location == 'right':
        return Row(children=[grid, toolbar], sizing_mode=sizing_mode)

def grid(children=[], sizing_mode=None, nrows=None, ncols=None):
    """
    Conveniently create a grid of layoutable objects.

    Grids are created by using ``GridBox`` model. This gives the most control over
    the layout of a grid, but is also tedious and may result in unreadable code in
    practical applications. ``grid()`` function remedies this by reducing the level
    of control, but in turn providing a more convenient API.

    Supported patterns:

    1. Nested lists of layoutable objects. Assumes the top-level list represents
       a column and alternates between rows and columns in subsequent nesting
       levels. One can use ``None`` for padding purpose.

       >>> grid([p1, [[p2, p3], p4]])
       GridBox(children=[
           (p1, 0, 0, 1, 2),
           (p2, 1, 0, 1, 1),
           (p3, 2, 0, 1, 1),
           (p4, 1, 1, 2, 1),
       ])

    2. Nested ``Row`` and ``Column`` instances. Similar to the first pattern, just
       instead of using nested lists, it uses nested ``Row`` and ``Column`` models.
       This can be much more readable that the former. Note, however, that only
       models that don't have ``sizing_mode`` set are used.

       >>> grid(column(p1, row(column(p2, p3), p4)))
       GridBox(children=[
           (p1, 0, 0, 1, 2),
           (p2, 1, 0, 1, 1),
           (p3, 2, 0, 1, 1),
           (p4, 1, 1, 2, 1),
       ])

    3. Flat list of layoutable objects. This requires ``nrows`` and/or ``ncols`` to
       be set. The input list will be rearranged into a 2D array accordingly. One
       can use ``None`` for padding purpose.

       >>> grid([p1, p2, p3, p4], ncols=2)
       GridBox(children=[
           (p1, 0, 0, 1, 1),
           (p2, 0, 1, 1, 1),
           (p3, 1, 0, 1, 1),
           (p4, 1, 1, 1, 1),
       ])

    """
    row = namedtuple("row", ["children"])
    col = namedtuple("col", ["children"])

    def flatten(layout):
        Item = namedtuple("Item", ["layout", "r0", "c0", "r1", "c1"])
        Grid = namedtuple("Grid", ["nrows", "ncols", "items"])

        def gcd(a, b):
            a, b = abs(a), abs(b)
            while b != 0:
                a, b = b, a % b
            return a

        def lcm(a, *rest):
            for b in rest:
                a = (a*b) // gcd(a, b)
            return a

        nonempty = lambda child: child.nrows != 0 and child.ncols != 0

        def _flatten(layout):
            if isinstance(layout, row):
                children = list(filter(nonempty, map(_flatten, layout.children)))
                if not children:
                    return Grid(0, 0, [])

                nrows = lcm(*[ child.nrows for child in children ])
                ncols = sum(child.ncols for child in children)

                items = []
                offset = 0
                for child in children:
                    factor = nrows//child.nrows

                    for (layout, r0, c0, r1, c1) in child.items:
                        items.append((layout, factor*r0, c0 + offset, factor*r1, c1 + offset))

                    offset += child.ncols

                return Grid(nrows, ncols, items)
            elif isinstance(layout, col):
                children = list(filter(nonempty, map(_flatten, layout.children)))
                if not children:
                    return Grid(0, 0, [])

                nrows = sum(child.nrows for child in children)
                ncols = lcm(*[ child.ncols for child in children ])

                items = []
                offset = 0
                for child in children:
                    factor = ncols//child.ncols

                    for (layout, r0, c0, r1, c1) in child.items:
                        items.append((layout, r0 + offset, factor*c0, r1 + offset, factor*c1))

                    offset += child.nrows

                return Grid(nrows, ncols, items)
            else:
                return Grid(1, 1, [Item(layout, 0, 0, 1, 1)])

        grid = _flatten(layout)

        children = []
        for (layout, r0, c0, r1, c1) in grid.items:
            if layout is not None:
                children.append((layout, r0, c0, r1 - r0, c1 - c0))

        return GridBox(children=children)

    if isinstance(children, list):
        if nrows is not None or ncols is not None:
            N = len(children)
            if ncols is None:
                ncols = math.ceil(N/nrows)
            layout = col([ row(children[i:i+ncols]) for i in range(0, N, ncols) ])
        else:
            def traverse(children, level=0):
                if isinstance(children, list):
                    container = col if level % 2 == 0 else row
                    return container([ traverse(child, level+1) for child in children ])
                else:
                    return children

            layout = traverse(children)
    elif isinstance(children, LayoutDOM):
        def is_usable(child):
            return _has_auto_sizing(child) and child.spacing == 0

        def traverse(item, top_level=False):
            if isinstance(item, Box) and (top_level or is_usable(item)):
                container = col if isinstance(item, Column) else row
                return container(list(map(traverse, item.children)))
            else:
                return item

        layout = traverse(children, top_level=True)
    elif isinstance(children, str):
        raise NotImplementedError
    else:
        raise ValueError("expected a list, string or model")

    grid = flatten(layout)

    if sizing_mode is not None:
        grid.sizing_mode = sizing_mode

        for child in grid.children:
            layout = child[0]
            if _has_auto_sizing(layout):
                layout.sizing_mode = sizing_mode

    return grid

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class GridSpec:
    """ Simplifies grid layout specification. """

    def __init__(self, nrows, ncols):
        self.nrows = nrows
        self.ncols = ncols
        self._arrangement = {}

        from .util.deprecation import deprecated
        deprecated("'GridSpec' is deprecated and will be removed in Bokeh 3.0")

    def __setitem__(self, key, obj):
        k1, k2 = key

        if isinstance(k1, slice):
            row1, row2, _ = k1.indices(self.nrows)
        else:
            if k1 < 0:
                k1 += self.nrows
            if k1 >= self.nrows or k1 < 0:
                raise IndexError("index out of range")
            row1, row2 = k1, None

        if isinstance(k2, slice):
            col1, col2, _ = k2.indices(self.ncols)
        else:
            if k2 < 0:
                k2 += self.ncols
            if k2 >= self.ncols or k2 < 0:
                raise IndexError("index out of range")
            col1, col2 = k2, None

        # gs[row, col]             = obj
        # gs[row1:row2, col]       = [...]
        # gs[row, col1:col2]       = [...]
        # gs[row1:row2, col1:col2] = [[...], ...]

        def get_or_else(fn, default):
            try:
                return fn()
            except IndexError:
                return default

        if row2 is None and col2 is None:
            self._arrangement[row1, col1] = obj
        elif row2 is None:
            for col in range(col1, col2):
                self._arrangement[row1, col] = get_or_else(lambda: obj[col-col1], None) # lgtm [py/loop-variable-capture]
        elif col2 is None:
            for row in range(row1, row2):
                self._arrangement[row, col1] = get_or_else(lambda: obj[row-row1], None) # lgtm [py/loop-variable-capture]
        else:
            for row, col in zip(range(row1, row2), range(col1, col2)):
                self._arrangement[row, col] = get_or_else(lambda: obj[row-row1][col-col1], None) # lgtm [py/loop-variable-capture]

    def __iter__(self):
        array = [ [ None ]*self.ncols for _ in range(0, self.nrows) ]
        for (row, col), obj in self._arrangement.items():
            array[row][col] = obj
        return iter(array)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _has_auto_sizing(item):
    return item.sizing_mode is None and item.width_policy == "auto" and item.height_policy == "auto"

def _parse_children_arg(*args, **kwargs):
    children = kwargs.get('children')

    # Set-up Children from args or kwargs
    if len(args) > 0 and children is not None:
        raise ValueError("'children' keyword cannot be used with positional arguments")

    if not children:
        if len(args) == 1 and isinstance(args[0], list):
            children = args[0]
        elif len(args) == 1 and isinstance(args[0], GridSpec):
            children = args[0]
        else:
            children = list(args)

    return children

def _handle_child_sizing(children, sizing_mode, *, widget):
    for item in children:
        if not isinstance(item, LayoutDOM):
            raise ValueError(f"Only LayoutDOM items can be inserted into a {widget}. Tried to insert: {item} of type {type(item)}")
        if sizing_mode is not None and _has_auto_sizing(item):
            item.sizing_mode = sizing_mode


def _create_grid(iterable, sizing_mode, layer=0, **kwargs):
    """Recursively create grid from input lists."""
    return_list = []
    for item in iterable:
        if isinstance(item, list):
            return_list.append(_create_grid(item, sizing_mode, layer+1))
        elif isinstance(item, LayoutDOM):
            if sizing_mode is not None and _has_auto_sizing(item):
                item.sizing_mode = sizing_mode
            return_list.append(item)
        else:
            raise ValueError(
                """Only LayoutDOM items can be inserted into a layout.
                Tried to insert: %s of type %s""" % (item, type(item))
            )
    if layer % 2 == 0:
        return column(children=return_list, sizing_mode=sizing_mode, **kwargs)
    return row(children=return_list, sizing_mode=sizing_mode, **kwargs)


def _chunks(l, ncols):
    """Yield successive n-sized chunks from list, l."""
    assert isinstance(ncols, int), "ncols must be an integer"
    for i in range(0, len(l), ncols):
        yield l[i: i+ncols]

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
