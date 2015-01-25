"""

"""
from __future__ import absolute_import

from ...properties import Bool, Float, Enum
from ...enums import NamedIcon
from ..widget import Widget

class AbstractIcon(Widget):
    """

    """

class Icon(AbstractIcon):
    """

    """

    name = Enum(NamedIcon, help="""

    """)

    size = Float(None, help="""

    """)

    flip = Enum("horizontal", "vertical", default=None, help="""

    """)

    spin = Bool(False, help="""

    """)

