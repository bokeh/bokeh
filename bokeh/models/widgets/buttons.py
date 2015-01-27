""" Various kinds of button widgets.  """

from __future__ import absolute_import

from ...properties import Bool, Int, String, Enum, Instance, List, Tuple
from ...enums import ButtonType
from ..widget import Widget
from .icons import AbstractIcon

class AbstractButton(Widget):
    """ An abstract base class that defines common properties for all button types. """

    label = String("Button", help="""
    Button's text.
    """)

    icon = Instance(AbstractIcon, help="""
    An optional image on the left of button's text.
    """)

    type = Enum(ButtonType, help="""
    Mostly affects stylistic aspect of a button, signifying it's role.
    """)

class Button(AbstractButton):
    """ A click button. """

    clicks = Int(0, help="""
    A private property used to trigger ``on_click`` event handler.
    """)

    def on_click(self, handler):
        """ Handles button click event. """
        self.on_change('clicks', lambda obj, attr, old, new: handler())

class Toggle(AbstractButton):
    """ A two-state toggle button. """

    active = Bool(False, help="""
    The initial state of a button. Also used to trigger ``on_click`` event handler.
    """)

    def on_click(self, handler):
        """ Handles button state change (click) event. """
        self.on_change('active', lambda obj, attr, old, new: handler(new))

class Dropdown(AbstractButton):
    """ A dropdown button. """

    action = String(help="""
    A private property used to trigger ``on_click`` event handler.
    """)

    default_action = String(help="""
    The default action, otherwise the first item in ``menu`` will be used.
    """)

    menu = List(Tuple(String, String), help="""
    Button's dropdown menu consisting of entries containing item's text and action name.
    Use ``None`` as a menu separator.
    """)

    def on_click(self, handler):
        """ Handles button or menu item click event. """
        self.on_change('action', lambda obj, attr, old, new: handler(new))
