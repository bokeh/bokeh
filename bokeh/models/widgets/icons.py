""" Various kinds of icon widgets. """

from __future__ import absolute_import

from ...properties import Bool, Float, Enum
from ...enums import NamedIcon
from ..widget import Widget

class AbstractIcon(Widget):
    """ An abstract base class for icon widgets. """

class Icon(AbstractIcon):
    """ A "stock" icon based on FontAwesome. """

    name = Enum(NamedIcon, help="""
    What icon to use. See http://fortawesome.github.io/Font-Awesome/icons/ for the list of available icons.
    """)

    size = Float(None, help="""
    The size multiplier (1x, 2x, ..., 5x).
    """)

    flip = Enum("horizontal", "vertical", default=None, help="""
    Optionally flips the icon horizontally or vertically.
    """)

    spin = Bool(False, help="""
    Indicates a spinning (animated) icon. This option isn't viable for most icons.
    """)
