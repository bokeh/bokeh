''' Functions for arranging bokeh Layout objects.

'''

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from __future__ import absolute_import

from .core.enums import Location, Responsive
from .models.tools import ToolbarBox
from .models.plots import Plot
from .models.layouts import LayoutDOM, Row, Column, Spacer


def layout(children=None, responsive='box', *args):
    """ Create a grid-based arrangement of Bokeh Layout objects. Forces all objects to
    have the same responsive mode, which is required for complex layouts to work.

    Args:
        children List(List(Instance(LayoutDOM))): An list of lists containing any of the
        following: Plot, Widget, WidgetBox, Row, Column, ToolbarBox, Spacer. All tems in the grid
        are then assigned the responsive mode of the layout.

        responsive Enum(``box``, ``fixed``, ``width_ar``, ``height_ar``, ``box_ar``) :  How
        the grid will respond to the html page. Default is ``box``.

    Examples:

        >>> layout([[plot_1, plot_2], [plot_3, plot_4]])
        >>> layout(
                children=[
                    [widget_box_1, plot_1],
                    [slider],
                    [widget_box_2, plot_2, plot_3]
                ],
                responsive='fixed',
            )

    """
    # Set-up Children from args or kwargs
    if len(args) > 0 and children is not None:
        raise ValueError("'children' keyword cannot be used with positional arguments")
    elif len(args) > 0:
        children = list(args)
    if not children:
        return
    if not hasattr(Responsive, responsive):
        raise ValueError("Invalid value of responsive: %s" % responsive)

    # Make the grid
    rows = []

    for row in children:
        row_children = []
        for item in row:
            if isinstance(item, LayoutDOM):
                item.responsive = responsive
                row_children.append(item)
            else:
                raise ValueError(
                    """Only LayoutDOM items can be inserted into a layout.
                    Tried to insert: %s of type %s""" % (item, type(item))
                )
        rows.append(Row(children=row_children, responsive=responsive))

    grid = Column(children=rows, responsive=responsive)
    return grid


def gridplot(children=None, toolbar_location='left', responsive='fixed', toolbar_options=None, *args):
    """ Create a grid of plots rendered on separate canvases.

    Args:
        children List(List(Instance(Plot))): An array of plots to display in a
        grid, given as a list of lists of Plot objects. To leave a position in
        the grid empty, pass None for that position in the children list.

        toolbar_location Enum(``above``, ``below``, ``left``, ``right``) : Where the
        toolbar will be located, with respect to the grid. If set to None,
        no toolbar will be attached to the grid.

        responsive Enum(``box``, ``fixed``, ``width_ar``, ``height_ar``, ``box_ar``) :  How
        the grid will respond to the html page. Default is ``fixed``.

        toolbar_options Dict (optional) : A dictionary of options that will be used to construct the
        toolbar (an instance of class::bokeh.models.tools.ToolbarBox). If none is supplied,
        ToolbarBox's defaults will be used.

    Examples:

        >>> gridplot([[plot_1, plot_2], [plot_3, plot_4]])
        >>> gridplot(
                children=[[plot_1, plot_2], [None, plot_3]],
                toolbar_location='right'
                responsive='fixed',
                toolbar_options=dict(logo='gray')
            )

    """

    # Integrity checks

    if len(args) > 0 and children is not None:
        raise ValueError("'children' keyword cannot be used with positional arguments")
    elif len(args) > 0:
        children = list(args)
    if not children:
        children = []
    if not hasattr(Responsive, responsive):
        raise ValueError("Invalid value of responsive: %s" % responsive)

    if toolbar_location:
        if not hasattr(Location, toolbar_location):
            raise ValueError("Invalid value of toolbar_location: %s" % toolbar_location)

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
                item.responsive = responsive
                row_children.append(item)
            else:
                raise ValueError("Only LayoutDOM items can be inserted into Grid")
        tools = tools + row_tools
        rows.append(Row(children=row_children, responsive=responsive))

    grid = Column(children=rows, responsive=responsive)

    # Make the toolbar
    if toolbar_location:
        if not toolbar_options:
            toolbar_options = {}
        if 'toolbar_location' not in toolbar_options:
            toolbar_options['toolbar_location'] = toolbar_location
        toolbar = ToolbarBox(
            tools=tools,
            responsive=responsive,
            **toolbar_options
        )

    # Set up children
    if toolbar_location == 'above':
        return Column(children=[toolbar, grid], responsive=responsive)
    elif toolbar_location == 'below':
        return Column(children=[grid, toolbar], responsive=responsive)
    elif toolbar_location == 'left':
        return Row(children=[toolbar, grid], responsive=responsive)
    elif toolbar_location == 'right':
        return Row(children=[grid, toolbar], responsive=responsive)
    else:
        return grid
