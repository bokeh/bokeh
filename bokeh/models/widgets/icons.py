from __future__ import absolute_import

from ...properties import Bool, Float, Enum
from ...enums import NamedIcon
from ..widget import Widget

class AbstractIcon(Widget):
    pass

class Icon(AbstractIcon):
    name = Enum(NamedIcon)
    size = Float(None)
    flip = Enum("horizontal", "vertical", default=None)
    spin = Bool(False)
