"""

"""
from __future__ import absolute_import

from ...properties import Int, Instance, List
from ..widget import Widget

class Layout(Widget):
    """

    """

    width = Int(help="""

    """)

    height = Int(help="""

    """)

class HBox(Layout):
    """

    """

    def __init__(self, *args, **kwargs):
        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        if len(args) > 0:
            kwargs["children"] = list(args)
        super(HBox, self).__init__(**kwargs)

    children = List(Instance(Widget), help="""

    """)

class VBox(Layout):
    """

    """

    def __init__(self, *args, **kwargs):
        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        if len(args) > 0:
            kwargs["children"] = list(args)
        super(VBox, self).__init__(**kwargs)

    children = List(Instance(Widget), help="""

    """)

# parent class only, you need to set the fields you want
class VBoxForm(VBox):
    """

    """
