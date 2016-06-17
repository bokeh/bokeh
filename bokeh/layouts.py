''' Functions for arranging bokeh Layout objects.

'''

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from __future__ import absolute_import

from .core.enums import Location, SizingMode
from .models.tools import ToolbarBox
from .models.plots import Plot
from .models.layouts import LayoutDOM, Row, Column, Spacer, WidgetBox
from .models.widgets import Widget
from .util._plot_arg_helpers import _convert_responsive


#-----------------------------------------------------------------------------
# Common helper functions
#-----------------------------------------------------------------------------
def _handle_children(children, *args):
    # Set-up Children from args or kwargs
    if len(args) > 0 and children is not None:
        raise ValueError("'children' keyword cannot be used with positional arguments")
    elif len(args) > 0:
        children = list(args)
    if not children:
        return
    return children


def _verify_sizing_mode(sizing_mode):
    if sizing_mode not in SizingMode:
        raise ValueError("Invalid value of sizing_mode: %s" % sizing_mode)


def row(children=None, sizing_mode='fixed', responsive=None, *args):
    """ Create a row of Bokeh Layout objects. Forces all objects to
    have the same sizing_mode, which is required for complex layouts to work.

    Args:
        children List(Instance(LayoutDOM)): An list containing any of the
        following: Plot, Widget, WidgetBox, Row, Column, ToolbarBox, Spacer. All items
        are then assigned the sizing_mode of the layout.

        sizing_mode ``"fixed"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"``, and
        ``"stretch_both"``. Default is ``"fixed"``. How will the items in the layout resize to
        fill the available space.

        responsive ``True``, ``False``. True sets ``sizing_mode`` to
        ``"width_ar"``. ``False`` sets ``sizing_mode`` to ``"fixed"``. Using
        responsive will override sizing_mode.

    Examples:

        >>> row([plot_1, plot_2])
        >>> row(children=[widget_box_1, plot_1], sizing_mode='stretch_both')
    """

    if responsive:
        sizing_mode = _convert_responsive(responsive)
    _verify_sizing_mode(sizing_mode)
    children = _handle_children(children, *args)

    row_children = []
    for item in children:
        if isinstance(item, LayoutDOM):
            item.sizing_mode = sizing_mode
            row_children.append(item)
        else:
            raise ValueError(
                """Only LayoutDOM items can be inserted into a row.
                Tried to insert: %s of type %s""" % (item, type(item))
            )
    return Row(children=row_children, sizing_mode=sizing_mode)


def column(children=None, sizing_mode='fixed', responsive=None, *args):
    """ Create a column of Bokeh Layout objects. Forces all objects to
    have the same sizing_mode, which is required for complex layouts to work.

    Args:
        children List(Instance(LayoutDOM)): An list containing any of the
        following: Plot, Widget, WidgetBox, Row, Column, ToolbarBox, Spacer. All items
        are then assigned the sizing_mode of the layout.

        sizing_mode ``"fixed"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"``, and
        ``"stretch_both"``. Default is ``"fixed"``. How will the items in the layout resize to
        fill the available space.

        responsive ``True``, ``False``. True sets ``sizing_mode`` to
        ``"width_ar"``. ``False`` sets ``sizing_mode`` to ``"fixed"``. Using
        responsive will override sizing_mode.

    Examples:

        >>> column([plot_1, plot_2])
        >>> column(children=[widget_box_1, plot_1], sizing_mode='stretch_both')
    """

    if responsive:
        sizing_mode = _convert_responsive(responsive)
    _verify_sizing_mode(sizing_mode)
    children = _handle_children(children, *args)

    col_children = []
    for item in children:
        if isinstance(item, LayoutDOM):
            item.sizing_mode = sizing_mode
            col_children.append(item)
        else:
            raise ValueError(
                """Only LayoutDOM items can be inserted into a column.
                Tried to insert: %s of type %s""" % (item, type(item))
            )
    return Column(children=col_children, sizing_mode=sizing_mode)


def widgetbox(children=None, sizing_mode='fixed', responsive=None, *args):
    """ Create a widgetbox of Bokeh widgets. Forces all to
    have the same sizing_mode, which is required for complex layouts to work.

    Args:
        children List(Instance(Widget)): An list of widgets. All tems in the grid
        are then assigned the sizing_mode of the layout.

        sizing_mode ``"fixed"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"``, and
        ``"stretch_both"``. Default is ``"fixed"``. How will the items in the layout resize to
        fill the available space.

        responsive ``True``, ``False``. True sets ``sizing_mode`` to
        ``"width_ar"``. ``False`` sets ``sizing_mode`` to ``"fixed"``. Using
        responsive will override sizing_mode.

    Examples:

        >>> widgetbox([button, select])
        >>> widgetbox(children=[slider], sizing_mode='scale_width')
    """

    if responsive:
        sizing_mode = _convert_responsive(responsive)
    _verify_sizing_mode(sizing_mode)
    children = _handle_children(children, *args)

    widget_children = []
    for item in children:
        if isinstance(item, Widget):
            item.sizing_mode = sizing_mode
            widget_children.append(item)
        else:
            raise ValueError(
                """Only Widgets can be inserted into a WidgetBox.
                Tried to insert: %s of type %s""" % (item, type(item))
            )
    return WidgetBox(children=widget_children, sizing_mode=sizing_mode)


def layout(children=None, sizing_mode='fixed', responsive=None, *args):
    """ Create a grid-based arrangement of Bokeh Layout objects. Forces all objects to
    have the same sizing mode, which is required for complex layouts to work.

    Args:
        children List(List(Instance(LayoutDOM))): An list of lists containing any of the
        following: Plot, Widget, WidgetBox, Row, Column, ToolbarBox, Spacer. All items
        in the grid are then assigned the sizing mode of the layout.

        sizing_mode ``"fixed"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"``, and
        ``"stretch_both"``. Default is ``"fixed"``. How will the items in the layout resize to
        fill the available space.

        responsive ``True``, ``False``. True sets ``sizing_mode`` to
        ``"width_ar"``. ``False`` sets ``sizing_mode`` to ``"fixed"``. Using
        responsive will override sizing_mode.

    Examples:

        >>> layout([[plot_1, plot_2], [plot_3, plot_4]])
        >>> layout(
                children=[
                    [widget_box_1, plot_1],
                    [slider],
                    [widget_box_2, plot_2, plot_3]
                ],
                sizing_mode='fixed',
            )

    """
    if responsive:
        sizing_mode = _convert_responsive(responsive)
    _verify_sizing_mode(sizing_mode)
    children = _handle_children(children, *args)

    # Make the grid
    rows = []
    for r in children:
        row_children = []
        for item in r:
            if isinstance(item, LayoutDOM):
                item.sizing_mode = sizing_mode
                row_children.append(item)
            else:
                raise ValueError(
                    """Only LayoutDOM items can be inserted into a layout.
                    Tried to insert: %s of type %s""" % (item, type(item))
                )
        rows.append(row(children=row_children, sizing_mode=sizing_mode))
    grid = column(children=rows, sizing_mode=sizing_mode)
    return grid


def gridplot(children=None, toolbar_location='left', sizing_mode='fixed', responsive=None, toolbar_options=None, plot_width=None, plot_height=None, *args):
    """ Create a grid of plots rendered on separate canvases.

    Args:
        children List(List(Instance(Plot))): An array of plots to display in a
        grid, given as a list of lists of Plot objects. To leave a position in
        the grid empty, pass None for that position in the children list.

        toolbar_location Enum(``above``, ``below``, ``left``, ``right``) : Where the
        toolbar will be located, with respect to the grid. If set to None,
        no toolbar will be attached to the grid.

        sizing_mode ``"fixed"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"``, and
        ``"stretch_both"``. Default is ``"fixed"``. How will the items in the grid resize to
        fill the available space.

        responsive ``True``, ``False``. True sets ``sizing_mode`` to
        ``"width_ar"``. ``False`` sets ``sizing_mode`` to ``"fixed"``. Using
        responsive will override sizing_mode.

        toolbar_options Dict (optional) : A dictionary of options that will be
        used to construct the toolbar (an instance of
        class::bokeh.models.tools.ToolbarBox). If none is supplied,
        ToolbarBox's defaults will be used.

    Examples:

        >>> gridplot([[plot_1, plot_2], [plot_3, plot_4]])
        >>> gridplot(
                children=[[plot_1, plot_2], [None, plot_3]],
                toolbar_location='right'
                sizing_mode='fixed',
                toolbar_options=dict(logo='gray')
            )

    """
    # Integrity checks & set-up
    if responsive:
        sizing_mode = _convert_responsive(responsive)
    _verify_sizing_mode(sizing_mode)
    if toolbar_location:
        if not hasattr(Location, toolbar_location):
            raise ValueError("Invalid value of toolbar_location: %s" % toolbar_location)
    children = _handle_children(children, *args)

    # Additional children set-up for GridPlot
    if not children:
        children = []
    if isinstance(children, GridSpec):
        children = list(children)

    # Make the grid
    tools = []
    rows = []

    for row in children:
        row_tools = []
        row_children = []
        for item in row:
            if isinstance(item, Plot):
                row_tools = row_tools + item.toolbar.tools
                item.toolbar_location = None
            if item is None:
                for neighbor in row:
                    if isinstance(neighbor, Plot):
                        break
                item = Spacer(width=neighbor.plot_width, height=neighbor.plot_height)
            if isinstance(item, LayoutDOM):
                item.sizing_mode = sizing_mode
                if isinstance(item, Plot):
                    if plot_width:
                        item.plot_width = plot_width
                    if plot_height:
                        item.plot_height = plot_height
                row_children.append(item)
            else:
                raise ValueError("Only LayoutDOM items can be inserted into Grid")
        tools = tools + row_tools
        rows.append(Row(children=row_children, sizing_mode=sizing_mode))

    grid = Column(children=rows, sizing_mode=sizing_mode)

    # Make the toolbar
    if toolbar_location:
        if not toolbar_options:
            toolbar_options = {}
        if 'toolbar_location' not in toolbar_options:
            toolbar_options['toolbar_location'] = toolbar_location
        toolbar = ToolbarBox(
            tools=tools,
            sizing_mode=sizing_mode,
            **toolbar_options
        )

    # Set up children
    if toolbar_location == 'above':
        return Column(children=[toolbar, grid], sizing_mode=sizing_mode)
    elif toolbar_location == 'below':
        return Column(children=[grid, toolbar], sizing_mode=sizing_mode)
    elif toolbar_location == 'left':
        return Row(children=[toolbar, grid], sizing_mode=sizing_mode)
    elif toolbar_location == 'right':
        return Row(children=[grid, toolbar], sizing_mode=sizing_mode)
    else:
        return grid


class GridSpec(object):
    """ Simplifies grid layout specification. """

    def __init__(self, nrows, ncols):
        self.nrows = nrows
        self.ncols = ncols
        self._arrangement = {}

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
                self._arrangement[row1, col] = get_or_else(lambda: obj[col-col1], None)
        elif col2 is None:
            for row in range(row1, row2):
                self._arrangement[row, col1] = get_or_else(lambda: obj[row-row1], None)
        else:
            for row, col in zip(range(row1, row2), range(col1, col2)):
                self._arrangement[row, col] = get_or_else(lambda: obj[row-row1][col-col1], None)

    def __iter__(self):
        array = [ [ None ]*self.ncols for _ in range(0, self.nrows) ]
        for (row, col), obj in self._arrangement.items():
            array[row][col] = obj
        return iter(array)
