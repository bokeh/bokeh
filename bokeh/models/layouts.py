""" Various kinds of layout components.

"""
from __future__ import absolute_import

import warnings
import logging
logger = logging.getLogger(__name__)

from ..core import validation
from ..core.validation.warnings import EMPTY_LAYOUT, BOTH_CHILD_AND_ROOT
from ..core.properties import abstract, Bool, Int, Instance, List, Either, Responsive
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
    the aspect ratio (plot_width/plot_height) is maintained.

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


# ---- DEPRECATIONS

@deprecated("Bokeh 0.12.0", "bokeh.models.layouts.Row")
def HBox(*args, **kwargs):
    warnings.warn(
        """
        The new Column is responsive by default, it resizes based on the space available.
        """)
    return Row(*args, **kwargs)


@deprecated("Bokeh 0.12.0", "bokeh.models.layouts.Column")
def VBox(*args, **kwargs):
    warnings.warn(
        """
        The new Column is responsive by default, it resizes based on the space available.
        """)
    return Column(*args, **kwargs)


@deprecated("Bokeh 0.12.0", "bokeh.models.layouts.Column")
def VBoxForm(*args, **kwargs):
    warnings.warn(
        """
        The new Column is responsive by default, it resizes based on the space available.
        """)
    return Column(*args, **kwargs)
