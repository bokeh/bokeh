from __future__ import absolute_import

from ...properties import Bool, Int, String, Enum, Instance, List
from ...enums import ButtonType
from ..widget import Widget

class AbstractGroup(Widget):
    labels = List(String)
    # active = AbstractProperty

    def on_click(self, handler):
        self.on_change('active', lambda obj, attr, old, new: handler(new))

class Group(AbstractGroup):
    inline = Bool(False)

class ButtonGroup(AbstractGroup):
    type = Enum(ButtonType)

class CheckboxGroup(Group):
    active = List(Int)

class RadioGroup(Group):
    active = Int(None)

class CheckboxButtonGroup(ButtonGroup):
    active = List(Int)

class RadioButtonGroup(ButtonGroup):
    active = Int(None)
