""" Various kinds of layout components.

"""
from __future__ import absolute_import

import logging
logger = logging.getLogger(__name__)

from ..core import validation
from ..core.validation.warnings import EMPTY_LAYOUT, BOTH_CHILD_AND_ROOT
from ..core.properties import abstract
from ..core.properties import Int, Instance, List

from .component import Component

@abstract
class Layout(Component):
    """ An abstract base class for layout components. ``Layout`` is not
    generally useful to instantiate on its own.

    """

    width = Int(help="""
    An optional width for the component (in pixels).
    """)

    height = Int(help="""
    An optional height for the component (in pixels).
    """)

@abstract
class BaseBox(Layout):
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

    children = List(Instance(Component), help="""
    The list of children, which can be other components including layouts,
    widgets and plots.
    """)


class HBox(BaseBox):
    """ Lay out child components in a single horizontal row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    """


class Row(HBox):
    pass


class VBox(BaseBox):
    """ Lay out child components in a single vertical row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    """


class Column(VBox):
    pass


# parent class only, you need to set the fields you want
class VBoxForm(VBox):
    """
    Basically, a VBox, where all components (generally form stuff)
    is wrapped in a <form> tag - important for bootstrap css
    """
