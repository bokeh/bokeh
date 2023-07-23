#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Functions for arranging bokeh layout objects.

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
import math
from collections import defaultdict
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Iterable,
    Iterator,
    Sequence,
    TypeVar,
    Union,
    overload,
)

# Bokeh imports
from .core.enums import Location, LocationType, SizingModeType
from .models import (
    Column,
    CopyTool,
    ExamineTool,
    FlexBox,
    FullscreenTool,
    GridBox,
    GridPlot,
    LayoutDOM,
    Plot,
    Row,
    SaveTool,
    Spacer,
    Tool,
    Toolbar,
    ToolProxy,
    UIElement,
)
from .util.dataclasses import dataclass

if TYPE_CHECKING:
    from typing_extensions import TypeAlias

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'column',
    'grid',
    'gridplot',
    'layout',
    'row',
    'Spacer',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@overload
def row(children: list[UIElement], *, sizing_mode: SizingModeType | None = None, **kwargs: Any) -> Row: ...
@overload
def row(*children: UIElement, sizing_mode: SizingModeType | None = None, **kwargs: Any) -> Row: ...

def row(*children: UIElement | list[UIElement], sizing_mode: SizingModeType | None = None, **kwargs: Any) -> Row:
    """ Create a row of Bokeh Layout objects. Forces all objects to
    have the same sizing_mode, which is required for complex layouts to work.

    Args:
        children (list of :class:`~bokeh.models.LayoutDOM` ): A list of instances for
            the row. Can be any of the following - |Plot|,
            :class:`~bokeh.models.Widget`,
            :class:`~bokeh.models.Row`,
            :class:`~bokeh.models.Column`,
            :class:`~bokeh.models.Spacer`.

        sizing_mode (``"fixed"``, ``"stretch_both"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"`` ): How
            will the items in the layout resize to fill the available space.
            Default is ``"fixed"``. For more information on the different
            modes see :attr:`~bokeh.models.LayoutDOM.sizing_mode`
            description on :class:`~bokeh.models.LayoutDOM`.

    Returns:
        Row: A row of LayoutDOM objects all with the same sizing_mode.

    Examples:

        >>> row(plot1, plot2)
        >>> row(children=[widgets, plot], sizing_mode='stretch_both')
    """
    _children = _parse_children_arg(*children, children=kwargs.pop("children", None))
    _handle_child_sizing(_children, sizing_mode, widget="row")
    return Row(children=_children, sizing_mode=sizing_mode, **kwargs)

@overload
def column(children: list[UIElement], *, sizing_mode: SizingModeType | None = None, **kwargs: Any) -> Column: ...
@overload
def column(*children: UIElement, sizing_mode: SizingModeType | None = None, **kwargs: Any) -> Column: ...

def column(*children: UIElement | list[UIElement], sizing_mode: SizingModeType | None = None, **kwargs: Any) -> Column:
    """ Create a column of Bokeh Layout objects. Forces all objects to
    have the same sizing_mode, which is required for complex layouts to work.

    Args:
        children (list of :class:`~bokeh.models.LayoutDOM` ): A list of instances for
            the column. Can be any of the following - |Plot|,
            :class:`~bokeh.models.Widget`,
            :class:`~bokeh.models.Row`,
            :class:`~bokeh.models.Column`,
            :class:`~bokeh.models.Spacer`.

        sizing_mode (``"fixed"``, ``"stretch_both"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"`` ): How
            will the items in the layout resize to fill the available space.
            Default is ``"fixed"``. For more information on the different
            modes see :attr:`~bokeh.models.LayoutDOM.sizing_mode`
            description on :class:`~bokeh.models.LayoutDOM`.

    Returns:
        Column: A column of LayoutDOM objects all with the same sizing_mode.

    Examples:

        >>> column(plot1, plot2)
        >>> column(children=[widgets, plot], sizing_mode='stretch_both')
    """
    _children = _parse_children_arg(*children, children=kwargs.pop("children", None))
    _handle_child_sizing(_children, sizing_mode, widget="column")
    return Column(children=_children, sizing_mode=sizing_mode, **kwargs)


def layout(*args: UIElement, children: list[UIElement] | None = None, sizing_mode: SizingModeType | None = None, **kwargs: Any) -> Column:
    """ Create a grid-based arrangement of Bokeh Layout objects.

    Args:
        children (list of lists of :class:`~bokeh.models.LayoutDOM` ): A list of lists of instances
            for a grid layout. Can be any of the following - |Plot|,
            :class:`~bokeh.models.Widget`,
            :class:`~bokeh.models.Row`,
            :class:`~bokeh.models.Column`,
            :class:`~bokeh.models.Spacer`.

        sizing_mode (``"fixed"``, ``"stretch_both"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"`` ): How
            will the items in the layout resize to fill the available space.
            Default is ``"fixed"``. For more information on the different
            modes see :attr:`~bokeh.models.LayoutDOM.sizing_mode`
            description on :class:`~bokeh.models.LayoutDOM`.

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
    _children = _parse_children_arg(*args, children=children)
    return _create_grid(_children, sizing_mode, **kwargs)

def gridplot(
        children: list[list[UIElement | None]], *,
        sizing_mode: SizingModeType | None = None,
        toolbar_location: LocationType | None = "above",
        ncols: int | None = None,
        width: int | None = None,
        height: int | None = None,
        toolbar_options: Any = None, # TODO
        merge_tools: bool = True) -> GridPlot:
    ''' Create a grid of plots rendered on separate canvases.

    The ``gridplot`` function builds a single toolbar for all the plots in the
    grid. ``gridplot`` is designed to layout a set of plots. For general
    grid layout, use the :func:`~bokeh.layouts.layout` function.

    Args:
        children (list of lists of |Plot|): An array of plots to display in a
            grid, given as a list of lists of Plot objects. To leave a position
            in the grid empty, pass None for that position in the children list.
            OR list of |Plot| if called with ncols.

        sizing_mode (``"fixed"``, ``"stretch_both"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"`` ): How
            will the items in the layout resize to fill the available space.
            Default is ``"fixed"``. For more information on the different
            modes see :attr:`~bokeh.models.LayoutDOM.sizing_mode`
            description on :class:`~bokeh.models.LayoutDOM`.

        toolbar_location (``above``, ``below``, ``left``, ``right`` ): Where the
            toolbar will be located, with respect to the grid. Default is
            ``above``. If set to None, no toolbar will be attached to the grid.

        ncols (int, optional): Specify the number of columns you would like in your grid.
            You must only pass an un-nested list of plots (as opposed to a list of lists of plots)
            when using ncols.

        width (int, optional): The width you would like all your plots to be

        height (int, optional): The height you would like all your plots to be.

        toolbar_options (dict, optional) : A dictionary of options that will be
            used to construct the grid's toolbar (an instance of
            :class:`~bokeh.models.Toolbar`). If none is supplied,
            Toolbar's defaults will be used.

        merge_tools (``True``, ``False``): Combine tools from all child plots into
            a single toolbar.

    Returns:
        GridPlot:

    Examples:

        >>> gridplot([[plot_1, plot_2], [plot_3, plot_4]])
        >>> gridplot([plot_1, plot_2, plot_3, plot_4], ncols=2, width=200, height=100)
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
            raise ValueError(f"Invalid value of toolbar_location: {toolbar_location}")

    children = _parse_children_arg(children=children)
    if ncols:
        if any(isinstance(child, list) for child in children):
            raise ValueError("Cannot provide a nested list when using ncols")
        children = list(_chunks(children, ncols))

    # Additional children set-up for grid plot
    if not children:
        children = []

    # Make the grid
    tools: list[Tool | ToolProxy] = []
    items: list[tuple[UIElement, int, int]] = []

    for y, row in enumerate(children):
        for x, item in enumerate(row):
            if item is None:
                continue
            elif isinstance(item, LayoutDOM):
                if merge_tools:
                    for plot in item.select(dict(type=Plot)):
                        tools.extend(plot.toolbar.tools)
                        plot.toolbar_location = None

                if width is not None:
                    item.width = width
                if height is not None:
                    item.height = height

                if sizing_mode is not None and _has_auto_sizing(item):
                    item.sizing_mode = sizing_mode

                items.append((item, y, x))
            elif isinstance(item, UIElement):
                continue
            else:
                raise ValueError("Only UIElement and LayoutDOM items can be inserted into a grid")

    def merge(cls: type[Tool], group: list[Tool]):
        if issubclass(cls, (SaveTool, CopyTool, ExamineTool, FullscreenTool)):
            return cls()
        else:
            return None

    toolbar = Toolbar(tools=tools if not merge_tools else group_tools(tools, merge=merge), **toolbar_options)
    return GridPlot(children=items, toolbar=toolbar, toolbar_location=toolbar_location, sizing_mode=sizing_mode)

# XXX https://github.com/python/mypy/issues/731
@overload
def grid(children: list[UIElement | list[UIElement | list[Any]]], *, sizing_mode: SizingModeType | None = ...) -> GridBox: ...
@overload
def grid(children: Row | Column, *, sizing_mode: SizingModeType | None = ...) -> GridBox: ...
@overload
def grid(children: list[UIElement | None], *, sizing_mode: SizingModeType | None = ..., nrows: int) -> GridBox: ...
@overload
def grid(children: list[UIElement | None], *, sizing_mode: SizingModeType | None = ..., ncols: int) -> GridBox: ...
@overload
def grid(children: list[UIElement | None], *, sizing_mode: SizingModeType | None = ..., nrows: int, ncols: int) -> GridBox: ...
@overload
def grid(children: str, *, sizing_mode: SizingModeType | None = ...) -> GridBox: ...

def grid(children: Any = [], sizing_mode: SizingModeType | None = None, nrows: int | None = None, ncols: int | None = None) -> GridBox:
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
    @dataclass
    class row:
        children: list[row | col]
    @dataclass
    class col:
        children: list[row | col]

    @dataclass
    class Item:
        layout: LayoutDOM
        r0: int
        c0: int
        r1: int
        c1: int

    @dataclass
    class Grid:
        nrows: int
        ncols: int
        items: list[Item]

    def flatten(layout) -> GridBox:
        def gcd(a: int, b: int) -> int:
            a, b = abs(a), abs(b)
            while b != 0:
                a, b = b, a % b
            return a

        def lcm(a: int, *rest: int) -> int:
            for b in rest:
                a = (a*b) // gcd(a, b)
            return a

        def nonempty(child: Grid) -> bool:
            return child.nrows != 0 and child.ncols != 0

        def _flatten(layout: row | col | LayoutDOM) -> Grid:
            if isinstance(layout, row):
                children = list(filter(nonempty, map(_flatten, layout.children)))
                if not children:
                    return Grid(0, 0, [])

                nrows = lcm(*[ child.nrows for child in children ])
                ncols = sum(child.ncols for child in children)

                items: list[Item] = []
                offset = 0
                for child in children:
                    factor = nrows//child.nrows

                    for i in child.items:
                        items.append(Item(i.layout, factor*i.r0, i.c0 + offset, factor*i.r1, i.c1 + offset))

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

                    for i in child.items:
                        items.append(Item(i.layout, i.r0 + offset, factor*i.c0, i.r1 + offset, factor*i.c1))

                    offset += child.nrows

                return Grid(nrows, ncols, items)
            else:
                return Grid(1, 1, [Item(layout, 0, 0, 1, 1)])

        grid = _flatten(layout)

        children = []
        for i in grid.items:
            if i.layout is not None:
                children.append((i.layout, i.r0, i.c0, i.r1 - i.r0, i.c1 - i.c0))

        return GridBox(children=children)

    layout: row | col
    if isinstance(children, list):
        if nrows is not None or ncols is not None:
            N = len(children)
            if ncols is None:
                ncols = math.ceil(N/nrows)
            layout = col([ row(children[i:i+ncols]) for i in range(0, N, ncols) ])
        else:
            def traverse(children: list[LayoutDOM], level: int = 0):
                if isinstance(children, list):
                    container = col if level % 2 == 0 else row
                    return container([ traverse(child, level+1) for child in children ])
                else:
                    return children

            layout = traverse(children)
    elif isinstance(children, LayoutDOM):
        def is_usable(child: LayoutDOM) -> bool:
            return _has_auto_sizing(child) and child.spacing == 0

        def traverse(item: LayoutDOM, top_level: bool = False):
            if isinstance(item, FlexBox) and (top_level or is_usable(item)):
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

T = TypeVar("T", bound=Tool)
MergeFn: TypeAlias = Callable[[type[T], list[T]], Union[Tool, ToolProxy, None]]

def group_tools(tools: list[Tool | ToolProxy], *, merge: MergeFn[Tool] | None = None,
        ignore: set[str] | None = None) -> list[Tool | ToolProxy]:
    """ Group common tools into tool proxies. """
    @dataclass
    class ToolEntry:
        tool: Tool
        props: Any

    by_type: defaultdict[type[Tool], list[ToolEntry]] = defaultdict(list)
    computed: list[Tool | ToolProxy] = []

    if ignore is None:
        ignore = {"overlay", "renderers"}

    for tool in tools:
        if isinstance(tool, ToolProxy):
            computed.append(tool)
        else:
            props = tool.properties_with_values()
            for attr in ignore:
                if attr in props:
                    del props[attr]
            by_type[tool.__class__].append(ToolEntry(tool, props))

    for cls, entries in by_type.items():
        if merge is not None:
            merged = merge(cls, [entry.tool for entry in entries])
            if merged is not None:
                computed.append(merged)
                continue

        while entries:
            head, *tail = entries
            group: list[Tool] = [head.tool]
            for item in list(tail):
                if item.props == head.props:
                    group.append(item.tool)
                    entries.remove(item)
            entries.remove(head)

            if len(group) == 1:
                computed.append(group[0])
            elif merge is not None and (tool := merge(cls, group)) is not None:
                computed.append(tool)
            else:
                computed.append(ToolProxy(tools=group))

    return computed

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _has_auto_sizing(item: LayoutDOM) -> bool:
    return item.sizing_mode is None and item.width_policy == "auto" and item.height_policy == "auto"

L = TypeVar("L", bound=LayoutDOM)
def _parse_children_arg(*args: L | list[L], children: list[L] | None = None) -> list[L]:
    # Set-up Children from args or kwargs
    if len(args) > 0 and children is not None:
        raise ValueError("'children' keyword cannot be used with positional arguments")

    if not children:
        if len(args) == 1:
            [arg] = args
            if isinstance(arg, list):
                return arg

        return list(args)

    return children

def _handle_child_sizing(children: list[UIElement], sizing_mode: SizingModeType | None, *, widget: str) -> None:
    for item in children:
        if isinstance(item, UIElement):
            continue
        if not isinstance(item, LayoutDOM):
            raise ValueError(f"Only LayoutDOM items can be inserted into a {widget}. Tried to insert: {item} of type {type(item)}")
        if sizing_mode is not None and _has_auto_sizing(item):
            item.sizing_mode = sizing_mode

def _create_grid(iterable: Iterable[UIElement | list[UIElement]], sizing_mode: SizingModeType | None, layer: int = 0, **kwargs) -> Row | Column:
    """Recursively create grid from input lists."""
    return_list: list[UIElement] = []
    for item in iterable:
        if isinstance(item, list):
            return_list.append(_create_grid(item, sizing_mode, layer + 1))
        elif isinstance(item, LayoutDOM):
            if sizing_mode is not None and _has_auto_sizing(item):
                item.sizing_mode = sizing_mode
            return_list.append(item)
        elif isinstance(item, UIElement):
            return_list.append(item)
        else:
            raise ValueError(
                f"""Only LayoutDOM items can be inserted into a layout.
                Tried to insert: {item} of type {type(item)}""",
            )
    if layer % 2 == 0:
        return column(children=return_list, sizing_mode=sizing_mode, **kwargs)
    else:
        return row(children=return_list, sizing_mode=sizing_mode, **kwargs)

I = TypeVar("I")

def _chunks(l: Sequence[I], ncols: int) -> Iterator[Sequence[I]]:
    """Yield successive n-sized chunks from list, l."""
    assert isinstance(ncols, int), "ncols must be an integer"
    for i in range(0, len(l), ncols):
        yield l[i: i + ncols]

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
