#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide color related properties.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import re

# Bokeh imports
from ... import colors
from .. import enums
from .bases import Property
from .container import Tuple
from .either import Either
from .enum import Enum
from .numeric import Byte, Percent
from .string import Regex

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Alpha',
    'Color',
    'RGB',
    'ColorHex',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class RGB(Property):
    """ Accept colors.RGB values.

    """

    def validate(self, value, detail=True):
        super().validate(value, detail)

        if value is None or isinstance(value, colors.RGB):
            return

        msg = "" if not detail else f"expected RGB value, got {value!r}"
        raise ValueError(msg)


class Color(Either):
    """ Accept color values in a variety of ways.

    For colors, because we support named colors and hex values prefaced
    with a "#", when we are handed a string value, there is a little
    interpretation: if the value is one of the 147 SVG named colors or
    it starts with a "#", then it is interpreted as a value.

    If a 3-tuple is provided, then it is treated as an RGB (0..255).
    If a 4-tuple is provided, then it is treated as an RGBa (0..255), with
    alpha as a float between 0 and 1.  (This follows the HTML5 Canvas API.)

    Example:

        .. code-block:: python

            >>> class ColorModel(HasProps):
            ...     prop = Color()
            ...

            >>> m = ColorModel()

            >>> m.prop = "firebrick"

            >>> m.prop = "#a240a2"

            >>> m.prop = (100, 100, 255)

            >>> m.prop = (100, 100, 255, 0.5)

            >>> m.prop = "junk"              # ValueError !!

            >>> m.prop = (100.2, 57.3, 10.2) # ValueError !!

    """

    _default_help = """\
    Acceptable values are:

    - any of the named `CSS colors`_, e.g ``'green'``, ``'indigo'``
    - RGB(A) hex strings, e.g., ``'#FF0000'``, ``'#44444444'``
    - CSS4 color strings, e.g., ``'rgba(255, 0, 127, 0.6)'``, ``'rgb(0 127 0 / 1.0)'``
    - a 3-tuple of integers (r, g, b) between 0 and 255
    - a 4-tuple of (r, g, b, a) where r, g, b are integers between 0..255 and a is between 0..1
    - a 32-bit unsiged integers using the 0xRRGGBBAA byte order pattern

    .. _CSS colors: https://www.w3.org/TR/css-color-4/#named-colors

    """

    def __init__(self, default=None, help=None):
        types = (Enum(enums.NamedColor),
                 Regex(r"^#[0-9a-fA-F]{3}$"),
                 Regex(r"^#[0-9a-fA-F]{4}$"),
                 Regex(r"^#[0-9a-fA-F]{6}$"),
                 Regex(r"^#[0-9a-fA-F]{8}$"),
                 Regex(r"^rgba\(((25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,"
                       r"\s*?){2}(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,"
                       r"\s*([01]\.?\d*?)\)"),
                 Regex(r"^rgb\(((25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,"
                       r"\s*?){2}(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*?\)"),
                 Tuple(Byte, Byte, Byte),
                 Tuple(Byte, Byte, Byte, Percent),
                 RGB)
        help = f"{help or ''}\n{self._default_help}"
        super().__init__(*types, default=default, help=help)

    def __str__(self):
        return self.__class__.__name__

    def transform(self, value):
        if isinstance(value, tuple):
            value = colors.RGB(*value).to_css()
        return value

    def _sphinx_type(self):
        return self._sphinx_prop_link()


class ColorHex(Color):
    """ ref Color

    The only difference with Color is it's transform in hexadecimal string
    when send to javascript side

    """

    def transform(self, value):
        if isinstance(value, str):
            value = value.lower()
            if value.startswith('rgb'):
                value = colors.RGB(*[int(val) for val in re.findall(r"\d+", value)[:3]]).to_hex()
            elif value in enums.NamedColor:
                value = getattr(colors.named, value).to_hex()
        elif isinstance(value, tuple):
            value = colors.RGB(*value).to_hex()
        else:
            value = value.to_hex()
        return value.lower()


class Alpha(Percent):

    _default_help = """\
    Acceptable values are numbers in 0..1 range (transparent..opaque).
    """

    def __init__(self, default=1.0, help=None):
        help = f"{help or ''}\n{self._default_help}"
        super().__init__(default=default, help=help)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
