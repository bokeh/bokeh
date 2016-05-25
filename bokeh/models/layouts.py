""" Various kinds of layout components.

"""
from __future__ import absolute_import

import warnings
import logging
logger = logging.getLogger(__name__)

from ..core import validation

from ..core.validation.warnings import (
    EMPTY_LAYOUT,
    BOTH_CHILD_AND_ROOT,
)
from ..core.enums import Location, Responsive as ResponsiveEnum
from ..core.properties import abstract, Bool, Int, Instance, List, Responsive
from ..embed import notebook_div
from ..model import Model
from ..util.deprecate import deprecated


@abstract
class LayoutDOM(Model):
    """ An abstract base class for layout components. ``LayoutDOM`` is not
    generally useful to instantiate on its own.

    """

    width = Int(help="""
    An optional width for the component (in pixels).
    """)

    height = Int(help="""
    An optional height for the component (in pixels).
    """)

    disabled = Bool(False, help="""
    Whether the widget will be disabled when rendered. If ``True``,
    the widget will be greyed-out, and not respond to UI events.
    """)

    responsive = Responsive('box', help="""
    The type of responsiveness for the item being displayed. Possible values are
    `fixed` (or `False`), `width_ar` (or `True`), `height_ar`, `box_ar`, `box`.
    Default is `box`.

    `box` mode constrains both the height and width. The items being laid out
    attempt to fit entirely within their box. Items will shrink and grow with both
    the height and width as their parent box changes size. This is sometimes called outside-in.
    This is a typical behavior for desktop applications.

    `fixed` mode prevents responsiveness. The items will have a fixed size.

    `width_ar` mode constrains only the width. The items being laid out will resize to
    fit the width and will take up whatever vertical space they may need. This is a
    typical behavior for modern websites. For a Plot,
    the aspect ratio (plot_width/plot_height) is maintained.

    `height_ar` mode constrains only the height. The items being laid out will resize to
    fit the height and will take up whatever width they may need. For a Plot,
    the aspect ratio (plot_width/plot_height) is maintained. A plot with `height_ar` mode needs
    to be wrapped in a Row or Column to be responsive.

    `box_ar` mode constrains the width and height, but maintains the plot aspect ratio
    for a plot inside the box.

    """)

    # TODO: (mp) Not yet, because it breaks plotting/notebook examples.
    # Rename to _repr_html_ if we decide to enable this by default.
    def __repr_html__(self):
        return notebook_div(self)

    @property
    def html(self):
        from IPython.core.display import HTML
        return HTML(self.__repr_html__())


class WidgetBox(LayoutDOM):
    """ A container for widgets that are part of a layout."""
    def __init__(self, *args, **kwargs):
        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        elif len(args) > 0:
            kwargs["children"] = list(args)
        super(WidgetBox, self).__init__(**kwargs)

    @validation.warning(EMPTY_LAYOUT)
    def _check_empty_layout(self):
        from itertools import chain
        if not list(chain(self.children)):
            return str(self)

    @validation.warning(BOTH_CHILD_AND_ROOT)
    def _check_child_is_also_root(self):
        problems = []
        for c in self.children:
            if c.document is not None and c in c.document.roots:
                problems.append(str(c))
        if problems:
            return ", ".join(problems)
        else:
            return None

    children = List(Instance('bokeh.models.widgets.Widget'), help="""
        The list of widgets to put in the layout box.
    """)


@abstract
class Box(LayoutDOM):
    """ Abstract base class for Row and Column. Do not use directly.
    """

    def __init__(self, *args, **kwargs):
        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        elif len(args) > 0:
            kwargs["children"] = list(args)
        super(Box, self).__init__(**kwargs)

    @validation.warning(EMPTY_LAYOUT)
    def _check_empty_layout(self):
        from itertools import chain
        if not list(chain(self.children)):
            return str(self)

    @validation.warning(BOTH_CHILD_AND_ROOT)
    def _check_child_is_also_root(self):
        problems = []
        for c in self.children:
            if c.document is not None and c in c.document.roots:
                problems.append(str(c))
        if problems:
            return ", ".join(problems)
        else:
            return None

    #TODO Debating the following instead to prevent people adding just a plain
    #     widget into a box, which sometimes works and sometimes looks disastrous
    #children = List(
    #    Either(
    #        Instance('bokeh.models.layouts.Row'),
    #        Instance('bokeh.models.layouts.Column'),
    #        Instance('bokeh.models.plots.Plot'),
    #        Instance('bokeh.models.layouts.WidgetBox')
    #    ), help="""
    #    The list of children, which can be other components including plots, rows, columns, and widgets.
    #""")
    children = List(Instance(LayoutDOM), help="""
        The list of children, which can be other components including plots, rows, columns, and widgets.
    """)


class Row(Box):
    """ Lay out child components in a single horizontal row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    """


class Column(Box):
    """ Lay out child components in a single vertical row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    """


def GridPlot(children=None, toolbar_location='left', responsive='box', toolbar_options=None, *args):
    """ Create a grid of plots rendered on separate canvases.

    Args:
        children List(List(Instance(Plot))): An array of plots to display in a
        grid, given as a list of lists of Plot objects. To leave a position in
        the grid empty, pass None for that position in the children list.

        toolbar_location Enum(``above``, ``below``, ``left``, ``right``) : Where the
        toolbar will be located, with respect to the grid. If set to None,
        no toolbar will be attached to the grid.

        responsive Enum(``box``, ``fixed``, ``width_ar``, ``height_ar``, ``box_ar``) :  How
        the grid will respond to the html page. Default is ``box``.

        toolbar_options Dict (optional) : A dictionary of options that will be used to construct the
        toolbar (an instance of class::bokeh.models.tools.ToolbarBox). If none is supplied,
        ToolbarBox's defaults will be used.

    Examples:

        >>> GridPlot([[plot_1, plot_2], [plot_3, plot_4]])
        >>> GridPlot(
                children=[[plot_1, plot_2]],
                toolbar_location='right'
                responsive='fixed',
                toolbar_options=dict(logo='gray')
            )

    """
    from bokeh.models.tools import ToolbarBox

    # Integrity checks

    if len(args) > 0 and children is not None:
        raise ValueError("'children' keyword cannot be used with positional arguments")
    elif len(args) > 0:
        children = list(args)

    if not children:
        children = []

    if toolbar_location:
        if not hasattr(Location, toolbar_location):
            raise ValueError("Invalid value of toolbar_location: %s" % toolbar_location)
    if responsive:
        if not hasattr(ResponsiveEnum, responsive):
            raise ValueError("Invalid value of responsive: %s" % responsive)

    # Make the grid
    tools = []
    rows = []

    for row in children:
        row_tools = []
        for plot in row:
            if plot:
                row_tools = row_tools + plot.toolbar.tools
                plot.toolbar_location = None
                plot.responsive = responsive
        tools = tools + row_tools
        rows.append(Row(children=row, responsive=responsive))

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


# ---- DEPRECATIONS

_WARNING_MSG = "Switching to '%s' will make elements responsive by default (they will resize based on the space available)"


@deprecated("Bokeh 0.12.0", "bokeh.models.layouts.Row")
def HBox(*args, **kwargs):
    kwargs['responsive'] = 'fixed'
    warnings.warn(_WARNING_MSG % "Row")
    return Row(*args, **kwargs)


@deprecated("Bokeh 0.12.0", "bokeh.models.layouts.Column")
def VBox(*args, **kwargs):
    kwargs['responsive'] = 'fixed'
    warnings.warn(_WARNING_MSG % "Column")
    return Column(*args, **kwargs)


@deprecated("Bokeh 0.12.0", "bokeh.models.layouts.Column")
def VBoxForm(*args, **kwargs):
    kwargs['responsive'] = 'fixed'
    warnings.warn(_WARNING_MSG % "Column")
    return Column(*args, **kwargs)
