''' Various kinds of panel widgets.

'''
from __future__ import absolute_import

from ...core.properties import Bool, Instance, Int, List, String

from ..callbacks import Callback
from ..layouts import LayoutDOM

from .widget import Widget

class Panel(Widget):
    ''' A single-widget container with title bar and controls.

    '''

    title = String(default="", help="""
    An optional text title of the panel.
    """)

    child = Instance(LayoutDOM, help="""
    The child widget. If you need more children, use a layout widget,
    e.g. ``Row`` or ``Column``.
    """)

    closable = Bool(False, help="""
    Whether this panel is closeable or not. If True, an "x" button will
    appear.
    """)

class Tabs(Widget):
    ''' A panel widget with navigation tabs.

    '''

    __example__ = "sphinx/source/docs/user_guide/examples/interaction_tab_panes.py"

    tabs = List(Instance(Panel), help="""
    The list of child panel widgets.
    """)

    active = Int(0, help="""
    The index of the active tab.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the button is activated.
    """)
