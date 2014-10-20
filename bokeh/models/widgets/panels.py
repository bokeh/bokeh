from __future__ import absolute_import

from ...properties import Bool, Int, String, Instance, List
from ..widget import Widget

class Panel(Widget):
    title = String
    child = Instance(Widget)
    closable = Bool(False)

class Tabs(Widget):
    tabs = List(Instance(Panel))
    active = Int(0)
