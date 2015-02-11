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


class BaseBox(Layout):
    """ Abstract base class for HBox and VBox. Do not use directly.
    """
    
    def __init__(self, *args, **kwargs):
        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        if (len(args) == 1 and hasattr(args[0], '__iter__') and 
            not isinstance(args[0], Widget)):
            # Note: check that not Widget, in case Widget/Layout ever gets __iter__
            kwargs["children"] = list(args[0])
        elif len(args) > 0:
            kwargs["children"] = list(args)
        super(BaseBox, self).__init__(**kwargs)

    children = List(Instance(Widget), help="""
    The list of children, which can be other widgets (including layouts)
    and plots.
    """)


class HBox(BaseBox):
    """ Lay out child widgets in a single horizontal row.
    
    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    """


class VBox(BaseBox):
    """ Lay out child widgets in a single vertical row.
    
    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    """


# parent class only, you need to set the fields you want
class VBoxForm(VBox):
    """

    """
