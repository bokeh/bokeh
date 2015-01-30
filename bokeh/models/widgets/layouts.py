""" Various kinds of lyaout widgets.

"""
from __future__ import absolute_import

from ...properties import Int, Instance, List
from ..widget import Widget

class Layout(Widget):
    """ An abstract base class for layout widgets. ``Layout`` is not
    generally useful to instantiate on its own.

    """

    width = Int(help="""
    An optional width for the widget (in pixels).
    """)

    height = Int(help="""
    An optional height for the widget (in pixels).
    """)

class HBox(Layout):
    """ Lay out child widgets in a single horizontal row.

    """

    def __init__(self, *args, **kwargs):
        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        if len(args) > 0:
            kwargs["children"] = list(args)
        super(HBox, self).__init__(**kwargs)

    children = List(Instance(Widget), help="""
    The list of children, which can be other widgets (including layouts)
    and plots.
    """)

class VBox(Layout):
    """ Lay out child widgets in a single vertical row.

    """

    def __init__(self, *args, **kwargs):
        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        if len(args) > 0:
            kwargs["children"] = list(args)
        super(VBox, self).__init__(**kwargs)

    children = List(Instance(Widget), help="""
    The list of children, which can be other widgets (including layouts)
    and plots.
    """)

# parent class only, you need to set the fields you want
class VBoxForm(VBox):
    """

    """
