""" Various kinds of pane widgets. """

from __future__ import absolute_import

from ...properties import Bool, Int, String, Instance, List
from ..widget import Widget

class Panel(Widget):
    """ A signle-widget container with title bar and controls. """

    title = String(help="""
    The optional text title of the panel.
    """)

    child = Instance(Widget, help="""
    The child widget. If you need more children, use a layout widget, e.g. ``HBox``.
    """)

    closable = Bool(False, help="""
    Indicates whether this panel is closable or not. An "x" button will appear if set to ``True``.
    """)

class Tabs(Widget):
    """ A tabulated panel widget. """

    tabs = List(Instance(Panel), help="""
    The list of child panel widgets.
    """)

    active = Int(0, help="""
    The index of the active tab.
    """)
