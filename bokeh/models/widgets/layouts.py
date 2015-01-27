""" Various kinds of lyaout widgets. """

from __future__ import absolute_import

from ...properties import Int, Instance, List
from ..widget import Widget

class Layout(Widget):
    """ An abstract base class for layout widgets. """

    width = Int(help="""
    The optional width of the widget in pixels.
    """)

    height = Int(help="""
    The optional height of the widget in pixels.
    """)

class HBox(Layout):
    """ ``HBox`` lays out its child widgets in a single horizontal row. """

    def __init__(self, *args, **kwargs):
        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        if len(args) > 0:
            kwargs["children"] = list(args)
        super(HBox, self).__init__(**kwargs)

    children = List(Instance(Widget), help="""
    The list of children, which can be other widgets (including layouts) and plots.
    """)

class VBox(Layout):
    """ ``VBox`` lays out its child widgets in a single vertical row. """

    def __init__(self, *args, **kwargs):
        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        if len(args) > 0:
            kwargs["children"] = list(args)
        super(VBox, self).__init__(**kwargs)

    children = List(Instance(Widget), help="""
    The list of children, which can be other widgets (including layouts) and plots.
    """)

# parent class only, you need to set the fields you want
class VBoxForm(VBox):
    """

    """
