""" Various kinds of layout components.

"""
from __future__ import absolute_import

import logging
logger = logging.getLogger(__name__)

from ..core import validation
from ..core.validation.warnings import EMPTY_LAYOUT, BOTH_CHILD_AND_ROOT
from ..core.properties import abstract, Bool, Int, Instance, List, Responsive
from ..embed import notebook_div
from ..model import Model


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

    responsive = Responsive('width', help="""
    The type of responsiveness for the item being displayed. Possible values are `box`,
    `width` (or `True`), `fixed` (or `False`). Default is `width`.

    `box` mode constrains both the height and width. The items being laid out
    attempt to fit entirely within the window. Items will shrink and grow with both
    the height and width of the browser window changing. This is sometimes called outside-in.
    This is a typical behavior for desktop applications.

    `width` mode constrains only the width. The items being laid out will resize to
    fit the width and will take up whatever vertical space they may need. This is a
    typical behavior for modern websites.

    `fixed` mode prevents responsiveness. The items will have a fixed size.
    """)

    # TODO: (mp) Not yet, because it breaks plotting/notebook examples.
    # Rename to _repr_html_ if we decide to enable this by default.
    def __repr_html__(self):
        return notebook_div(self)

    @property
    def html(self):
        from IPython.core.display import HTML
        return HTML(self.__repr_html__())


#============== START OLD LAYOUTS
#
# TODO: These will be removed or deprecated by 0.12,
# but not until a later PR in the the series of Layout PRs.

@abstract
class BaseBox(LayoutDOM):
    """ Abstract base class for HBox and VBox. Do not use directly.
    """

    def __init__(self, *args, **kwargs):
        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        elif len(args) > 0:
            kwargs["children"] = list(args)
        super(BaseBox, self).__init__(**kwargs)

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

    children = List(Instance(LayoutDOM), help="""
        The list of children, which can be other components including layouts, widgets and plots.
    """)


class HBox(BaseBox):
    """ Lay out child components in a single horizontal row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    """


class VBox(BaseBox):
    """ Lay out child components in a single vertical row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    """


# parent class only, you need to set the fields you want
class VBoxForm(VBox):
    """
    Basically, a VBox, where all components (generally form stuff)
    is wrapped in a <form> tag - important for bootstrap css
    """


#======= END OLD LAYOUTS

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

    children = List(Instance(LayoutDOM), help="""
        The list of children, which can be other components including plots, rows, columns, and widgets.
    """)

    grow = Bool(default=True, help="""
        Box grows to fit its container. Default value is True.
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
