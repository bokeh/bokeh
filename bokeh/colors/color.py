#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a base class for representing color values.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Color',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Color:
    ''' A base class for representing color objects.

    '''

    def __repr__(self):
        return self.to_css()

    @staticmethod
    def clamp(value, maximum=None):
        ''' Clamp numeric values to be non-negative, an optionally, less than a
        given maximum.

        Args:
            value (float) :
                A number to clamp.

            maximum (float, optional) :
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

    def copy(self):
        ''' Copy this color.

        *Subclasses must implement this method.*

        '''
        raise NotImplementedError

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

    def to_css(self):
        ''' Return a CSS representation of this color.

        *Subclasses must implement this method.*

        Returns:
            str

        '''
        raise NotImplementedError


    def to_hsl(self):
        ''' Create a new HSL color by converting from this color.

        *Subclasses must implement this method.*

        Returns:
            HSL

        '''
        raise NotImplementedError

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
