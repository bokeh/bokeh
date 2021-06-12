#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a class to represent colors with HSL (Hue, Saturation, Value).

'''

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
import colorsys
from typing import TYPE_CHECKING

# Bokeh imports
from ..util.deprecation import deprecated
from .color import Color

if TYPE_CHECKING:
    from .rgb import RGB

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'HSL',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class HSL(Color):
    ''' Represent colors by specifying their Hue, Saturation, and lightness.

    Alpha values may also optionally be provided. Otherwise, alpha values
    default to 1.

    .. warning::
        HSL is deprecated as of Bokeh 2.3.1 and will be removed in a future
        release. Use RGB or named colors instead.

    '''

    def __init__(self, h: float, s: float, l: float, a: float = 1.0) -> None:
        '''

        Args:
            h (int) :
                The Hue, in [0, 360]

            s (int) :
                The Saturation, in [0, 1]

            l (int) :
                The lightness, in [0, 1]

            a (float, optional) :
                An alpha value for this color in [0, 1] (default: 1.0)

        '''
        deprecated((2, 3, 1), "HSL()", "RGB() or named colors")
        self.h = h
        self.s = s
        self.l = l
        self.a = a

    def copy(self) -> HSL:
        ''' Return a copy of this color value.

        Returns:
            :class:`~bokeh.colors.hsl.HSL`

        '''
        return HSL(self.h, self.s, self.l, self.a)

    @classmethod
    def from_hsl(cls, value: HSL) -> HSL:
        ''' Copy an HSL color from another HSL color value.

        Args:
            value (HSL) :
                The HSL color to copy.

        Returns:
            :class:`~bokeh.colors.hsl.HSL`

        '''
        return value.copy()

    @classmethod
    def from_rgb(cls, value: RGB) -> HSL:
        ''' Create an HSL color from an RGB color value.

        Args:
            value (:class:`~bokeh.colors.rgb.RGB`) :
                The RGB color to convert.

        Returns:
            :class:`~bokeh.colors.hsl.HSL`

        '''
        return value.to_hsl()

    def to_css(self) -> str:
        ''' Generate the CSS representation of this HSL color.

        Returns:
            str, ``"hsl(...)"`` or ``"hsla(...)"``

        '''
        if self.a == 1.0:
            return f"hsl({self.h}, {self.s*100}%, {self.l*100}%)"
        else:
            return f"hsla({self.h}, {self.s*100}%, {self.l*100}%, {self.a})"

    def to_hsl(self) -> HSL:
        ''' Return a HSL copy for this HSL color.

        Returns:
            :class:`~bokeh.colors.hsl.HSL`

        '''
        return self.copy()

    def to_rgb(self) -> RGB:
        ''' Return a corresponding :class:`~bokeh.colors.rgb.RGB` color for
        this HSL color.

        Returns:
            :class:`~bokeh.colors.rgb.RGB`

        '''
        from .rgb import RGB  # prevent circular import
        r, g, b = colorsys.hls_to_rgb(float(self.h)/360, self.l, self.s)
        return RGB(round(r*255), round(g*255), round(b*255), self.a)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
