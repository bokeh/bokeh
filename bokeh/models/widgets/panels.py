""" Various kinds of panel widgets.

"""
from __future__ import absolute_import

from ...core.properties import Bool, Int, String, Instance, List
from .widget import Widget
from ..layouts import LayoutDOM
from ..callbacks import Callback

class Panel(Widget):
    """ A single-widget container with title bar and controls.

    """

    title = String(default="", help="""
    An optional text title of the panel.
    """)

    child = Instance(LayoutDOM, help="""
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

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the button is activated.
    """)
