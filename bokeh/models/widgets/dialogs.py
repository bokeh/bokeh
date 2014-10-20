from __future__ import absolute_import

from ...properties import Bool, String, List
from ..widget import Widget

class Dialog(Widget):
    visible = Bool(False)
    closable = Bool(True)
    title = String
    content = String
    buttons = List(String)
