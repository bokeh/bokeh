""" Various kinds of layout components.

"""
from __future__ import absolute_import

import warnings
import logging
logger = logging.getLogger(__name__)

from ..core import validation
from ..core.validation.warnings import EMPTY_LAYOUT, BOTH_CHILD_AND_ROOT
from ..core.properties import abstract, Bool, Int, Instance, List  # , Responsive
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

    # TODO: (mp) Not yet, because it breaks plotting/notebook examples.
    # Rename to _repr_html_ if we decide to enable this by default.
    def __repr_html__(self):
        return notebook_div(self)

    @property
    def html(self):
        from IPython.core.display import HTML
        return HTML(self.__repr_html__())


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
        The new Column is responsive by default, it resizes based on the space available. If you would
        like to keep using a fixed size column like HBox you can set responsive=False
        on Column. This has been automatically set HBox.
        """)
    return Row(*args, **kwargs)


@deprecated("Bokeh 0.12.0", "bokeh.models.layouts.Column")
def VBox(*args, **kwargs):
    warnings.warn(
        """
        The new Column is responsive by default, it resizes based on the space available. If you would
        like to keep using a fixed size column like VBox you can set responsive=False
        on Column. This has been automatically set VBox.
        """)
    return Column(*args, **kwargs)


@deprecated("Bokeh 0.12.0", "bokeh.models.layouts.Column")
def VBoxForm(*args, **kwargs):
    warnings.warn(
        """
        The new Column is responsive by default, it resizes based on the space available. If you would
        like to keep using a fixed size column like VBoxForm you can set responsive=False
        on Column. This has been automatically set VBoxForm.
        """)
    return Column(*args, **kwargs)
