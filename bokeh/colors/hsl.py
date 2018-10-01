#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a class to represent colors with HSL (Hue, Saturation, Value).

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
import colorsys

# External imports

# Bokeh imports
from .color import Color

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
    ''' Represent colors by specifying their Hue, Saturation, and Value.

    Alpha values may also optionally be provided. Otherwise, alpha values
    default to 1.

    '''

    def __init__(self, h, s, l, a=1.0):
        '''

        Args:
            h (int) :
                The Hue, in [0, 255]

            h (int) :
                The Saturation, in [0, 1]

            h (int) :
                The Value, in [0, 1]

            a (float, optional) :
                An alpha value for this color in [0, 1] (default: 1.0)

        '''
        self.h = h
        self.s = s
        self.l = l
        self.a = a

    def copy(self):
        ''' Return a copy of this color value.

        Returns:
            HSL

        '''
        return HSL(self.h, self.s, self.l, self.a)

    @classmethod
    def from_hsl(cls, value):
        ''' Copy an HSL color from another HSL color value.

        Args:
            value (HSL) :
                The HSL color to copy.

        Returns:
            HSL

        '''
        return value.copy()

    @classmethod
    def from_rgb(cls, value):
        ''' Create an HSL color from an RGB color value.

        Args:
            value (:class:`~bokeh.colors.rgb.RGB`) :
                The RGB color to convert.

        Returns:
            HSL

        '''
        return value.to_hsl()

    def to_css(self):
        ''' Generate the CSS representation of this HSL color.

        Returns:
            str, ``"hsl(...)"`` or ``"hsla(...)"``

        '''
        if self.a == 1.0:
            return "hsl(%d, %s%%, %s%%)" % (self.h, self.s*100, self.l*100)
        else:
            return "hsla(%d, %s%%, %s%%, %s)" % (self.h, self.s*100, self.l*100, self.a)

    def to_hsl(self):
        ''' Return a HSL copy for this HSL color.

        Returns:
            HSL

        '''
        return self.copy()

    def to_rgb(self):
        ''' Return a corresponding :class:`~bokeh.colors.rgb.RGB` color for
        this HSL color.

        Returns:
            HSL

        '''
        from .rgb import RGB # prevent circular import
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
