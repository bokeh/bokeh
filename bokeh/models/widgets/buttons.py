"""

"""
from __future__ import absolute_import

from ...properties import Bool, Int, String, Enum, Instance, List, Tuple
from ...enums import ButtonType
from ..widget import Widget
from .icons import AbstractIcon

class AbstractButton(Widget):
    """

    """

    label = String("Button", help="""

    """)

    icon = Instance(AbstractIcon, help="""

    """)

    type = Enum(ButtonType, help="""

    """)

class Button(AbstractButton):
    """

    """

    clicks = Int(0, help="""

    """)

    def on_click(self, handler):
        """

        """
        self.on_change('clicks', lambda obj, attr, old, new: handler())

class Toggle(AbstractButton):
    """

    """

    active = Bool(False, help="""

    """)

    def on_click(self, handler):
        """

        """
        self.on_change('active', lambda obj, attr, old, new: handler(new))

class Dropdown(AbstractButton):
    """

    """

    action = String(help="""

    """)

    default_action = String(help="""

    """)

    menu = List(Tuple(String, String), help="""

    """)

    def on_click(self, handler):
        """

        """
        self.on_change('action', lambda obj, attr, old, new: handler(new))
