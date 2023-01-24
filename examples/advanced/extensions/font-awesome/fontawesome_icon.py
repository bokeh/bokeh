from bokeh.core.properties import Bool, Enum, Nullable, Required
from bokeh.models import Icon

from named_icon import NamedIcon


class FontAwesomeIcon(Icon):
    """ A "stock" icon based on FontAwesome. """

    __implementation__ = "fontawesome_icon.ts"
    __dependencies__ = {"font-awesome": "^4.6.3"}

    icon_name = Required(Enum(NamedIcon), help="""
    What icon to use. See http://fortawesome.github.io/Font-Awesome/icons/
    for the list of available icons.
    """)

    flip = Nullable(Enum("horizontal", "vertical"), help="""
    Optionally flip the icon horizontally or vertically.
    """)

    spin = Bool(False, help="""
    Indicates a spinning (animated) icon. This value is ignored for
    icons that do not support spinning.
    """)
