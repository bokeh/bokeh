from __future__ import absolute_import

from ...properties import Bool, Int, String, Enum, Instance, List, Tuple
from ...enums import ButtonType
from ..widget import Widget
from .icons import AbstractIcon

class AbstractButton(Widget):
    label = String("Button")
    icon = Instance(AbstractIcon)
    type = Enum(ButtonType)

class Button(AbstractButton):
    clicks = Int(0)

    def on_click(self, handler):
        self.on_change('clicks', lambda obj, attr, old, new: handler())

class Toggle(AbstractButton):
    active = Bool(False)

    def on_click(self, handler):
        self.on_change('active', lambda obj, attr, old, new: handler(new))

class Dropdown(AbstractButton):
    action = String
    default_action = String
    menu = List(Tuple(String, String))

    def on_click(self, handler):
        self.on_change('action', lambda obj, attr, old, new: handler(new))
