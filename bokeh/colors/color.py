#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a base class for representing color values.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import general, dev ; general, dev

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@general((1,0,0))
class Color(object):
    ''' A base class for representing color objects.

    '''

    def __repr__(self):
        return self.to_css()

    @staticmethod
    @general((1,0,0))
    def clamp(value, maximum=None):
        ''' Clamp numeric values to be non-negative, an optionally, less than a
        given maximum.

        Args:
            value (float) :
                A number to clamp.

            maxiumum (float, optional) :
                A max bound to to clamp to. If None, there is no upper bound,
                and values are only clamped to be non-negative. (default: None)

        Returns:
            float

        '''
        value = max(value, 0)

        if maximum is not None:
            return min(value, maximum)
        else:
            return value

    @general((1,0,0))
    def copy(self):
        ''' Copy this color.

        *Subclasses must implement this method.*

        '''
        raise NotImplementedError

    @general((1,0,0))
    def darken(self, amount):
        ''' Darken (reduce the luminance) of this color.

        Args:
            amount (float) :
                Amount to reduce the luminance by (clamped above zero)

        Returns:
            Color

        '''
        hsl = self.to_hsl()
        hsl.l = self.clamp(hsl.l - amount)
        return self.from_hsl(hsl)


    @classmethod
    @general((1,0,0))
    def from_hsl(cls, value):
        ''' Create a new color by converting from an HSL color.

        *Subclasses must implement this method.*

        Args:
            value (HSL) :
                A color to convert from HSL

        Returns:
            Color

        '''
        raise NotImplementedError

    @classmethod
    @general((1,0,0))
    def from_rgb(cls, value):
        ''' Create a new color by converting from an RGB color.

        *Subclasses must implement this method.*

        Args:
            value (:class:`~bokeh.colors.rgb.RGB`) :
                A color to convert from RGB

        Returns:
            Color

        '''
        raise NotImplementedError

    @general((1,0,0))
    def lighten(self, amount):
        ''' Lighten (increase the luminance) of this color.

        Args:
            amount (float) :
                Amount to increase the luminance by (clamped above zero)

        Returns:
            Color

        '''
        hsl = self.to_hsl()
        hsl.l = self.clamp(hsl.l + amount, 1)
        return self.from_hsl(hsl)

    @general((1,0,0))
    def to_css(self):
        ''' Return a CSS representation of this color.

        *Subclasses must implement this method.*

        Returns:
            str

        '''
        raise NotImplementedError


    @general((1,0,0))
    def to_hsl(self):
        ''' Create a new HSL color by converting from this color.

        *Subclasses must implement this method.*

        Returns:
            HSL

        '''
        raise NotImplementedError

    @general((1,0,0))
    def to_rgb(self):
        ''' Create a new HSL color by converting from this color.

        *Subclasses must implement this method.*

        Returns:
            :class:`~bokeh.colors.rgb.RGB`

        '''
        raise NotImplementedError

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
