""" Various kinds of panel widgets.

"""
from __future__ import absolute_import

from ...properties import Bool, Int, String, Instance, List
from ..widget import Widget

class Panel(Widget):
    """ A single-widget container with title bar and controls.

    """

    title = String(help="""
    An optional text title of the panel.
    """)

    child = Instance(Widget, help="""
    The child widget. If you need more children, use a layout widget,
    e.g. ``HBox`` or ``VBox``.
    """)

    closable = Bool(False, help="""
    Whether this panel is closeable or not. If True, an "x" button will
    appear.
    """)

class Tabs(Widget):
    """ A panel widget with navigation tabs.

    """

    tabs = List(Instance(Panel), help="""
    The list of child panel widgets.
    """)

    active = Int(0, help="""
    The index of the active tab.
    """)

    def on_click(self, handler):
        """ Set up a handler for tab link clicks.

        Args:
            handler (func) : handler function to call when button is activated.

        Returns:
            None

        """
        self.on_change('active', lambda obj, attr, old, new: handler(new))
