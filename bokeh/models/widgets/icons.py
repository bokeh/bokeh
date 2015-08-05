""" Various kinds of icon widgets.

"""
from __future__ import absolute_import

from ...properties import Bool, Float, Enum, Int
from ...enums import NamedIcon
from ..widget import Widget

class AbstractIcon(Widget):
    """ An abstract base class for icon widgets. ``AbstractIcon``
    is not generally useful to instantiate on its own.

    """

class Icon(AbstractIcon):
    """ A "stock" icon based on FontAwesome.

    """

    name = Enum(NamedIcon, help="""
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

    spin_updates = Int(0, help="""
    This is a counter of the number of times the spin field has been updated.
    An ``on_change`` listener for ``spin_updates`` would get a callback after the
    ``spin`` field has been updated. With this one can perform multiple serial
    actions after an ``on_change`` callback, by first toggling the ``spin``
    property of this icon (which conveniently can inform the end user that
    another action will take place), and then performing the second action
    when ``on_change`` for ``spin_updates`` is called.
    """)
