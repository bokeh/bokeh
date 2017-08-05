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
def _handle_children(*args, **kwargs):
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


def _verify_sizing_mode(sizing_mode):
    if sizing_mode not in SizingMode:
        raise ValueError("Invalid value of sizing_mode: %s" % sizing_mode)


def row(*args, **kwargs):
    """ Create a row of Bokeh Layout objects. Forces all objects to
    have the same sizing_mode, which is required for complex layouts to work.

    Args:
        children (list of :class:`~bokeh.models.layouts.LayoutDOM` ): A list of instances for
            the row. Can be any of the following - :class:`~bokeh.models.plots.Plot`,
            :class:`~bokeh.models.widgets.widget.Widget`, :class:`~bokeh.models.layouts.WidgetBox`,
            :class:`~bokeh.models.layouts.Row`,
            :class:`~bokeh.models.layouts.Column`,
            :class:`~bokeh.models.tools.ToolbarBox`,
            :class:`~bokeh.models.layouts.Spacer`.

        sizing_mode (``"fixed"``, ``"stretch_both"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"`` ): How
            will the items in the layout resize to fill the available space.
            Default is ``"fixed"``. For more information on the different
            modes see :attr:`~bokeh.models.layouts.LayoutDOM.sizing_mode`
            description on :class:`~bokeh.models.layouts.LayoutDOM`.

        responsive (``True``, ``False``): True sets ``sizing_mode`` to
            ``"width_ar"``. ``False`` sets sizing_mode to ``"fixed"``. Using
            responsive will override sizing_mode.

    Returns:
        Row: A row of LayoutDOM objects all with the same sizing_mode.

    Examples:

        >>> row([plot_1, plot_2])
        >>> row(children=[widget_box_1, plot_1], sizing_mode='stretch_both')
    """

    responsive = kwargs.pop('responsive', None)
    sizing_mode = kwargs.pop('sizing_mode', 'fixed')
    children = kwargs.pop('children', None)

    if responsive:
        sizing_mode = _convert_responsive(responsive)
    _verify_sizing_mode(sizing_mode)
    children = _handle_children(*args, children=children)

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
    return Row(children=row_children, sizing_mode=sizing_mode, **kwargs)


def column(*args, **kwargs):
    """ Create a column of Bokeh Layout objects. Forces all objects to
    have the same sizing_mode, which is required for complex layouts to work.

    Args:
        children (list of :class:`~bokeh.models.layouts.LayoutDOM` ): A list of instances for
            the column. Can be any of the following - :class:`~bokeh.models.plots.Plot`,
            :class:`~bokeh.models.widgets.widget.Widget`, :class:`~bokeh.models.layouts.WidgetBox`,
            :class:`~bokeh.models.layouts.Row`,
            :class:`~bokeh.models.layouts.Column`,
            :class:`~bokeh.models.tools.ToolbarBox`,
            :class:`~bokeh.models.layouts.Spacer`.

        sizing_mode (``"fixed"``, ``"stretch_both"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"`` ): How
            will the items in the layout resize to fill the available space.
            Default is ``"fixed"``. For more information on the different
            modes see :attr:`~bokeh.models.layouts.LayoutDOM.sizing_mode`
            description on :class:`~bokeh.models.layouts.LayoutDOM`.

        responsive (``True``, ``False``): True sets ``sizing_mode`` to
            ``"width_ar"``. ``False`` sets sizing_mode to ``"fixed"``. Using
            responsive will override sizing_mode.

    Returns:
        Column: A column of LayoutDOM objects all with the same sizing_mode.

    Examples:

        >>> column([plot_1, plot_2])
        >>> column(children=[widget_box_1, plot_1], sizing_mode='stretch_both')
    """

    responsive = kwargs.pop('responsive', None)
    sizing_mode = kwargs.pop('sizing_mode', 'fixed')
    children = kwargs.pop('children', None)

    if responsive:
        sizing_mode = _convert_responsive(responsive)
    _verify_sizing_mode(sizing_mode)
    children = _handle_children(*args, children=children)

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
    return Column(children=col_children, sizing_mode=sizing_mode, **kwargs)


def widgetbox(*args, **kwargs):
    """ Create a WidgetBox of Bokeh widgets. Forces all to
    have the same sizing_mode, which is required for complex layouts to work.

    Args:
        children (list of :class:`~bokeh.models.widgets.widget.Widget` ): A list
        of widgets for the WidgetBox.

        sizing_mode (``"fixed"``, ``"stretch_both"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"`` ): How
            will the items in the layout resize to fill the available space.
            Default is ``"fixed"``. For more information on the different
            modes see :attr:`~bokeh.models.layouts.LayoutDOM.sizing_mode`
            description on :class:`~bokeh.models.layouts.LayoutDOM`.

        responsive (``True``, ``False``): True sets ``sizing_mode`` to
            ``"width_ar"``. ``False`` sets sizing_mode to ``"fixed"``. Using
            responsive will override sizing_mode.

    Returns:
        WidgetBox: A WidgetBox of Widget instances all with the same sizing_mode.

    Examples:

        >>> widgetbox([button, select])
        >>> widgetbox(children=[slider], sizing_mode='scale_width')
    """

    responsive = kwargs.pop('responsive', None)
    sizing_mode = kwargs.pop('sizing_mode', 'fixed')
    children = kwargs.pop('children', None)

    if responsive:
        sizing_mode = _convert_responsive(responsive)
    _verify_sizing_mode(sizing_mode)
    children = _handle_children(*args, children=children)

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
    return WidgetBox(children=widget_children, sizing_mode=sizing_mode, **kwargs)


def layout(*args, **kwargs):
    """ Create a grid-based arrangement of Bokeh Layout objects. Forces all objects to
    have the same sizing mode, which is required for complex layouts to work. Returns a nested set
    of Rows and Columns.

    Args:
        children (list of lists of :class:`~bokeh.models.layouts.LayoutDOM` ): A list of lists of instances
            for a grid layout. Can be any of the following - :class:`~bokeh.models.plots.Plot`,
            :class:`~bokeh.models.widgets.widget.Widget`, :class:`~bokeh.models.layouts.WidgetBox`,
            :class:`~bokeh.models.layouts.Row`,
            :class:`~bokeh.models.layouts.Column`,
            :class:`~bokeh.models.tools.ToolbarBox`,
            :class:`~bokeh.models.layouts.Spacer`.

        sizing_mode (``"fixed"``, ``"stretch_both"``, ``"scale_width"``, ``"scale_height"``, ``"scale_both"`` ): How
            will the items in the layout resize to fill the available space.
            Default is ``"fixed"``. For more information on the different
            modes see :attr:`~bokeh.models.layouts.LayoutDOM.sizing_mode`
            description on :class:`~bokeh.models.layouts.LayoutDOM`.

        responsive (``True``, ``False``): True sets ``sizing_mode`` to
            ``"width_ar"``. ``False`` sets sizing_mode to ``"fixed"``. Using
            responsive will override sizing_mode.

    Returns:
        Column: A column of ``Row`` layouts of the children, all with the same sizing_mode.

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
    responsive = kwargs.pop('responsive', None)
    sizing_mode = kwargs.pop('sizing_mode', 'fixed')
    children = kwargs.pop('children', None)

    if responsive:
        sizing_mode = _convert_responsive(responsive)
    _verify_sizing_mode(sizing_mode)
    children = _handle_children(*args, children=children)

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


def _chunks(l, ncols):
    """Yield successive n-sized chunks from list, l."""
    assert isinstance(ncols, int), "ncols must be an integer"
    for i in range(0, len(l), ncols):
        yield l[i: i+ncols]


def gridplot(*args, **kwargs):
    """ Create a grid of plots rendered on separate canvases. ``gridplot`` builds a single toolbar
    for all the plots in the grid. ``gridplot`` is designed to layout a set of plots. For general
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

        ncols ``Int`` (optional): Specify the number of columns you would like in your grid.
            You must only pass an un-nested list of plots (as opposed to a list of lists of plots)
            when using ncols.

        responsive (``True``, ``False``): True sets ``sizing_mode`` to
            ``"width_ar"``. ``False`` sets sizing_mode to ``"fixed"``. Using
            responsive will override sizing_mode.

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

    """
    toolbar_location = kwargs.get('toolbar_location', 'above')
    sizing_mode = kwargs.get('sizing_mode', 'fixed')
    children = kwargs.get('children')
    responsive = kwargs.get('responsive')
    toolbar_options = kwargs.get('toolbar_options')
    plot_width = kwargs.get('plot_width')
    plot_height = kwargs.get('plot_height')
    ncols = kwargs.get('ncols')
    merge_tools = kwargs.get('merge_tools', True)

    # Integrity checks & set-up
    if responsive:
        sizing_mode = _convert_responsive(responsive)
    _verify_sizing_mode(sizing_mode)

    if toolbar_location:
        if not hasattr(Location, toolbar_location):
            raise ValueError("Invalid value of toolbar_location: %s" % toolbar_location)

    children = _handle_children(*args, children=children)
    if ncols:
        if any(isinstance(child, list) for child in children):
            raise ValueError("Cannot provide a nested list when using ncols")
        children = list(_chunks(children, ncols))

    # Additional children set-up for grid plot
    if not children:
        children = []

    # Make the grid
    tools = []
    rows = []

    for row in children:
        row_tools = []
        row_children = []
        for item in row:
            if merge_tools:
                if item is not None:
                    for plot in item.select(dict(type=Plot)):
                        row_tools = row_tools + plot.toolbar.tools
                        plot.toolbar_location = None
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

    if not merge_tools:
        return grid

    # Make the toolbar
    if toolbar_location:
        if not toolbar_options:
            toolbar_options = {}
        if 'toolbar_location' not in toolbar_options:
            toolbar_options['toolbar_location'] = toolbar_location

        # Fixed sizing mode needs scale_width for the toolbar
        # for layout to work correctly.
        if sizing_mode == 'fixed':
            toolbar_sizing_mode = 'scale_width'
        else:
            toolbar_sizing_mode = sizing_mode
        toolbar = ToolbarBox(
            tools=tools,
            sizing_mode=toolbar_sizing_mode,
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
