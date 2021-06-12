#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a base class for representing color values.

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
from abc import ABCMeta, abstractmethod
from typing import TYPE_CHECKING, Type, TypeVar

## Bokeh imports
if TYPE_CHECKING:
    from .hsl import HSL
    from .rgb import RGB

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Color',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Self = TypeVar("Self", bound="Color")

class Color(metaclass=ABCMeta):
    ''' A base class for representing color objects.

    '''

    def __repr__(self) -> str:
        return self.to_css()

    @staticmethod
    def clamp(value: float, maximum: float | None = None) -> float:
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

    @abstractmethod
    def copy(self: Self) -> Self:
        ''' Copy this color.

        *Subclasses must implement this method.*

        '''
        raise NotImplementedError

    def darken(self: Self, amount: float) -> Self:
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
    @abstractmethod
    def from_hsl(cls: Type[Self], value: HSL) -> Self:
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
    @abstractmethod
    def from_rgb(cls: Type[Self], value: RGB) -> Self:
        ''' Create a new color by converting from an RGB color.

        *Subclasses must implement this method.*

        Args:
            value (:class:`~bokeh.colors.rgb.RGB`) :
                A color to convert from RGB

        Returns:
            Color

        '''
        raise NotImplementedError

    def lighten(self: Self, amount: float) -> Self:
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

    @abstractmethod
    def to_css(self) -> str:
        ''' Return a CSS representation of this color.

        *Subclasses must implement this method.*

        Returns:
            str

        '''
        raise NotImplementedError

    @abstractmethod
    def to_hsl(self) -> HSL:
        ''' Create a new HSL color by converting from this color.

        *Subclasses must implement this method.*

        Returns:
            HSL

        '''
        raise NotImplementedError

    @abstractmethod
    def to_rgb(self) -> RGB:
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
