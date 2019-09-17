#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide color related properties.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import re

# External imports
from six import string_types

# Bokeh imports
from ... import colors
from .. import enums
from .bases import Property
from .container import Tuple
from .enum import Enum
from .either import Either
from .numeric import Byte, Percent
from .regex import Regex

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Color',
    'RGB',
    'ColorHex',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class RGB(Property):
    ''' Accept colors.RGB values.

    '''

    def validate(self, value, detail=True):
        super(RGB, self).validate(value, detail)

        if not (value is None or isinstance(value, colors.RGB)):
            msg = "" if not detail else "expected RGB value, got %r" % (value,)
            raise ValueError(msg)


class Color(Either):
    ''' Accept color values in a variety of ways.

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

    '''

    def __init__(self, default=None, help=None):
        types = (Enum(enums.NamedColor),
                 Regex(r"^#[0-9a-fA-F]{6}$"),
                 Regex(r"^rgba\(((25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,"
                       r"\s*?){2}(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,"
                       r"\s*([01]\.?\d*?)\)"),
                 Regex(r"^rgb\(((25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,"
                       r"\s*?){2}(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*?\)"),
                 Tuple(Byte, Byte, Byte),
                 Tuple(Byte, Byte, Byte, Percent),
                 RGB)
        super(Color, self).__init__(*types, default=default, help=help)

    def __str__(self):
        return self.__class__.__name__

    def transform(self, value):
        if isinstance(value, tuple):
            value = colors.RGB(*value).to_css()
        return value

    def _sphinx_type(self):
        return self._sphinx_prop_link()


class ColorHex(Color):
    ''' ref Color

    The only difference with Color is it's transform in hexadecimal string
    when send to javascript side

    '''

    def transform(self, value):
        if isinstance(value, string_types):
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

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
