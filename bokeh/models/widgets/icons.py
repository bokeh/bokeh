""" Various kinds of icon widgets.

"""
from __future__ import absolute_import

from ...core.properties import abstract
from ...core.properties import Bool, Float, Enum
from ...core.enums import NamedIcon
from .widget import Widget

@abstract
class AbstractIcon(Widget):
    """ An abstract base class for icon widgets. ``AbstractIcon``
    is not generally useful to instantiate on its own.

    """

class Icon(AbstractIcon):
    """ A "stock" icon based on FontAwesome.

    """

    icon_name = Enum(NamedIcon, default="check", help="""
    What icon to use. See http://fortawesome.github.io/Font-Awesome/icons/
    for the list of available icons.
    """)

    size = Float(None, help="""
    The size multiplier (1x, 2x, ..., 5x).
    """)

    flip = Enum("horizontal", "vertical", default=None, help="""
    Optionally flip the icon horizontally or vertically.
    """)

    spin = Bool(False, help="""
    Indicates a spinning (animated) icon. This value is ignored for
    icons that do not support spinning.
    """)
