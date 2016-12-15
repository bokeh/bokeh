from bokeh.core.properties import Enum, Float, Bool
from bokeh.models.widgets.icons import AbstractIcon
from named_icon import NamedIcon

class FontAwesomeIcon(AbstractIcon):
    """ A "stock" icon based on FontAwesome. """

    __implementation__ = "fontawesome_icon.coffee"
    __dependencies__ = {"font-awesome": "^4.6.3"}

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
