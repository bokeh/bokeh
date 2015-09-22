""" Various kinds of button widgets.

"""
from __future__ import absolute_import

from ...properties import abstract
from ...properties import Bool, Int, String, Enum, Instance, List, Tuple
from ...enums import ButtonType
from ..callbacks import Callback
from ..widget import Widget
from .icons import AbstractIcon

@abstract
class AbstractButton(Widget):
    """ A base class that defines common properties for all
    button types. ``AbstractButton`` is not generally useful to
    instantiate on its own.

    """

    label = String("Button", help="""
    The text label for the button to display.
    """)

    icon = Instance(AbstractIcon, help="""
    An optional image appearing to the left of button's text.
    """)

    type = Enum(ButtonType, help="""
    A style for the button, signifying it's role.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the button is activated.
    """)

class Button(AbstractButton):
    """ A click button.

    """

    clicks = Int(0, help="""
    A private property used to trigger ``on_click`` event handler.
    """)

    def on_click(self, handler):
        """ Set up a handler for button clicks.

        Args:
            handler (func) : handler function to call when button is clicked.

        Returns:
            None

        """
        self.on_change('clicks', lambda obj, attr, old, new: handler())

class Toggle(AbstractButton):
    """ A two-state toggle button.

    """

    active = Bool(False, help="""
    The initial state of a button. Also used to trigger ``on_click`` event
    handler.
    """)

    def on_click(self, handler):
        """ Set up a handler for button state changes (clicks).

        Args:
            handler (func) : handler function to call when button is toggled.

        Returns:
            None

        """
        self.on_change('active', lambda obj, attr, old, new: handler(new))

class Dropdown(AbstractButton):
    """ A dropdown button.

    """

    value = String(help="""
    A private property used to trigger ``on_click`` event handler.
    """)

    default_value = String(help="""
    The default value, otherwise the first item in ``menu`` will be used.
    """)

    menu = List(Tuple(String, String), help="""
    Button's dropdown menu consisting of entries containing item's text and
    value name. Use ``None`` as a menu separator.
    """)

    def on_click(self, handler):
        """ Set up a handler for button or menu item clicks.

        Args:
            handler (func) : handler function to call when button is activated.

        Returns:
            None

        """
        self.on_change('value', lambda obj, attr, old, new: handler(new))



