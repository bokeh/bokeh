#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide color related properties.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import re
from typing import Any

# Bokeh imports
from ... import colors
from .. import enums
from .bases import Init, Property
from .container import Tuple
from .either import Either
from .enum import Enum
from .numeric import Byte, Percent
from .singletons import Undefined
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


class RGB(Property[colors.RGB]):
    """ Accept colors.RGB values.

    """

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if isinstance(value, colors.RGB):
            return

        msg = "" if not detail else f"expected RGB value, got {value!r}"
        raise ValueError(msg)


class Color(Either):
    """ Accept color values in a variety of ways.

    * If a color is provided as a string, Bokeh determines whether this string
      represents one of the |named CSS colors| (such as "red"), a CSS4 color
      string (such as "rgb(0, 200, 0)"), or a hex value (such as "#00FF00").
    * If a 3-tuple is provided, it is treated as RGB values (between 0 and
      255).
    * If a 4-tuple is provided, it is treated as RGBA values (between 0 and
      255 for RGB and alpha as a float between 0 and 1).
    * If a 32-bit unsigned integer is provided, it is treated as RGBA values in
      a 0xRRGGBBAA byte order pattern.

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

    - any of the |named CSS colors|, e.g ``'green'``, ``'indigo'``
    - RGB(A) hex strings, e.g., ``'#FF0000'``, ``'#44444444'``
    - CSS4 color strings, e.g., ``'rgba(255, 0, 127, 0.6)'``,
      ``'rgb(0 127 0 / 1.0)'``, or ``'hsl(60deg 100% 50% / 1.0)'``
    - a 3-tuple of integers (r, g, b) between 0 and 255
    - a 4-tuple of (r, g, b, a) where r, g, b are integers between 0 and 255,
      and a is between 0 and 1
    - a 32-bit unsigned integer using the 0xRRGGBBAA byte order pattern

    """

    def __init__(self, default: Init[str | tuple[int, int, int] | tuple[int, int, int, float]] = Undefined, *, help: str | None = None) -> None:
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

    def __str__(self) -> str:
        return self.__class__.__name__

    def transform(self, value: Any) -> Any:
        if isinstance(value, tuple):
            value = colors.RGB(*value).to_css()
        return value


class ColorHex(Color):
    """ ref Color

    The only difference to Color is that this class transforms values into
    hexadecimal strings to be sent to BokehJS.

    """

    def transform(self, value: Any) -> Any:
        if isinstance(value, str):
            value = value.lower()
            if value.startswith('rgb'):
                match = re.findall(r"[\d\.]+", value)
                a = float(match[3]) if value[3] == 'a' else 1.0
                value = colors.RGB(int(match[0]), int(match[1]), int(match[2]), a).to_hex()
            elif value in enums.NamedColor:
                value = getattr(colors.named, value).to_hex()
        elif isinstance(value, tuple):
            value = colors.RGB(*value).to_hex()
        else:
            value = value.to_hex()
        return value.lower()


class Alpha(Percent):

    _default_help = """\
    Acceptable values are floating-point numbers between 0 and 1 (0 being
    transparent and 1 being opaque).
    """

    def __init__(self, default: Init[float] = 1.0, *, help: str | None = None) -> None:
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
