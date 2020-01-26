#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import colorsys

# Bokeh imports
from .color import Color

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'RGB',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class RGB(Color):
    ''' Represent colors by specifying their Red, Green, and Blue channels.

    Alpha values may also optionally be provided. Otherwise, alpha values
    default to 1.

    '''

    def __init__(self, r, g, b, a=1.0):
        '''

        Args:
            r (int) :
                The value for the red channel in [0, 255]

            g (int) :
                The value for the green channel in [0, 255]

            b (int) :
                The value for the blue channel in [0, 255]

            a (float, optional) :
                An alpha value for this color in [0, 1] (default: 1.0)

        '''
        self.r = r
        self.g = g
        self.b = b
        self.a = a

    def copy(self):
        ''' Return a copy of this color value.

        Returns:
            :class:`~bokeh.colors.rgb.RGB`

        '''
        return RGB(self.r, self.g, self.b, self.a)

    @classmethod
    def from_hsl(self, value):
        ''' Create an RGB color from an HSL color value.

        Args:
            value (HSL) :
                The HSL color to convert.

        Returns:
            :class:`~bokeh.colors.rgb.RGB`

        '''
        return value.to_rgb()

    @classmethod
    def from_rgb(self, value):
        ''' Copy an RGB color from another RGB color value.

        Args:
            value (:class:`~bokeh.colors.rgb.RGB`) :
                The RGB color to copy.

        Returns:
            RGB

        '''
        return value.copy()

    def to_css(self):
        ''' Generate the CSS representation of this RGB color.

        Returns:
            str, ``"rgb(...)"`` or ``"rgba(...)"``

        '''
        if self.a == 1.0:
            return "rgb(%d, %d, %d)" % (self.r, self.g, self.b)
        else:
            return "rgba(%d, %d, %d, %s)" % (self.r, self.g, self.b, self.a)

    def to_hex(self):
        ''' Return a hex color string for this RGB color.

        Any alpha value on this color is discarded, only hex color strings for
        the RGB components are returned.

        Returns:
            str, ``"#RRGGBB"``

        '''
        return "#%02X%02X%02X" % (self.r, self.g, self.b)

    def to_hsl(self):
        ''' Return a corresponding HSL color for this RGB color.

        Returns:
            :class:`~bokeh.colors.rgb.RGB`

        '''
        from .hsl import HSL # prevent circular import
        h, l, s = colorsys.rgb_to_hls(float(self.r)/255, float(self.g)/255, float(self.b)/255)
        return HSL(round(h*360), s, l, self.a)

    def to_rgb(self):
        ''' Return a RGB copy for this RGB color.

        Returns:
            :class:`~bokeh.colors.rgb.RGB`

        '''
        return self.copy()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
