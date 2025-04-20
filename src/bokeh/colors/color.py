#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
import colorsys
from abc import ABCMeta, abstractmethod
from math import sqrt
from re import match
from typing import TYPE_CHECKING, TypeAlias, cast

# Bokeh imports
from ..core.serialization import AnyRep, Serializable, Serializer

if TYPE_CHECKING:
    import numpy as np
    from typing_extensions import Self

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Color',
    'ColorLike',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

RGBTuple = tuple[int, int, int] | tuple[int, int, int, float]

class Color(Serializable, metaclass=ABCMeta):
    ''' A base class for representing color objects.

    '''

    def __repr__(self) -> str:
        return self.to_css()

    def to_serializable(self, serializer: Serializer) -> AnyRep:
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
    def copy(self) -> Self:
        ''' Copy this color.

        *Subclasses must implement this method.*

        '''
        raise NotImplementedError

    def darken(self, amount: float) -> Self:
        ''' Darken (reduce the luminance) of this color.

        *Subclasses must implement this method.*

        Args:
            amount (float) :
                Amount to reduce the luminance by (clamped above zero)

        Returns:
            Color

        '''
        return self.lighten(-amount)

    @classmethod
    @abstractmethod
    def from_hsl(cls, value: HSL) -> Self:
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
    def from_rgb(cls, value: RGB) -> Self:
        ''' Create a new color by converting from an RGB color.

        *Subclasses must implement this method.*

        Args:
            value (:class:`~bokeh.colors.RGB`) :
                A color to convert from RGB

        Returns:
            Color

        '''
        raise NotImplementedError

    def lighten(self, amount: float) -> Self:
        ''' Lighten (increase the luminance) of this color.

        *Subclasses must implement this method.*

        Args:
            amount (float) :
                Amount to increase the luminance by (clamped above zero)

        Returns:
            Color

        '''
        rgb = self.to_rgb()
        h, l, s = colorsys.rgb_to_hls(float(rgb.r)/255, float(rgb.g)/255, float(rgb.b)/255)
        new_l = self.clamp(l + amount, 1)
        r, g, b = colorsys.hls_to_rgb(h, new_l, s)
        rgb.r = round(r * 255)
        rgb.g = round(g * 255)
        rgb.b = round(b * 255)
        return self.from_rgb(rgb)

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
            :class:`~bokeh.colors.RGB`

        '''
        raise NotImplementedError

class RGB(Color):
    ''' Represent colors by specifying their Red, Green, and Blue channels.

    Alpha values may also optionally be provided. Otherwise, alpha values
    default to 1.

    '''

    r: int
    g: int
    b: int
    a: float

    def __init__(self, r: int | np.integer, g: int | np.integer, b: int | np.integer, a: float | np.floating = 1.0) -> None:
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
        self.r = cast(int, r)
        self.g = cast(int, g)
        self.b = cast(int, b)
        self.a = cast(float, a)

    def copy(self) -> RGB:
        ''' Return a copy of this color value.

        Returns:
            :class:`~bokeh.colors.RGB`

        '''
        return RGB(self.r, self.g, self.b, self.a)

    @classmethod
    def from_hsl(cls, value: HSL) -> RGB:
        ''' Create an RGB color from an HSL color value.

        Args:
            value (HSL) :
                The HSL color to convert.

        Returns:
            :class:`~bokeh.colors.RGB`

        '''
        return value.to_rgb()

    @classmethod
    def from_hex_string(cls, hex_string: str) -> RGB:
        ''' Create an RGB color from a RGB(A) hex string.

        Args:
            hex_string (str) :
                String containing hex-encoded RGBA(A) values. Valid formats
                are '#rrggbb', '#rrggbbaa', '#rgb' and '#rgba'.

        Returns:
            :class:`~bokeh.colors.RGB`

        '''
        if isinstance(hex_string, str):
            # Hex color as #rrggbbaa or #rrggbb
            if match(r"#([\da-fA-F]{2}){3,4}\Z", hex_string):
                r = int(hex_string[1:3], 16)
                g = int(hex_string[3:5], 16)
                b = int(hex_string[5:7], 16)
                a = int(hex_string[7:9], 16) / 255.0 if len(hex_string) > 7 else 1.0
                return RGB(r, g, b, a)

            # Hex color as #rgb or #rgba
            if match(r"#[\da-fA-F]{3,4}\Z", hex_string):
                r = int(hex_string[1]*2, 16)
                g = int(hex_string[2]*2, 16)
                b = int(hex_string[3]*2, 16)
                a = int(hex_string[4]*2, 16) / 255.0 if len(hex_string) > 4 else 1.0
                return RGB(r, g, b, a)

        raise ValueError(f"'{hex_string}' is not an RGB(A) hex color string")

    @classmethod
    def from_tuple(cls, value: RGBTuple) -> RGB:
        ''' Initialize ``RGB`` instance from a 3- or 4-tuple. '''
        if len(value) == 3:
            r, g, b = value
            return RGB(r, g, b)
        else:
            r, g, b, a = value
            return RGB(r, g, b, a)

    @classmethod
    def from_rgb(cls, value: RGB) -> RGB:
        ''' Copy an RGB color from another RGB color value.

        Args:
            value (:class:`~bokeh.colors.RGB`) :
                The RGB color to copy.

        Returns:
            :class:`~bokeh.colors.RGB`

        '''
        return value.copy()

    def to_css(self) -> str:
        ''' Generate the CSS representation of this RGB color.

        Returns:
            str, ``"rgb(...)"`` or ``"rgba(...)"``

        '''
        if self.a == 1.0:
            return f"rgb({self.r}, {self.g}, {self.b})"
        else:
            return f"rgba({self.r}, {self.g}, {self.b}, {self.a})"

    def to_hex(self) -> str:
        ''' Return a hex color string for this RGB(A) color.

        Any alpha value is only included in the output string if it is less
        than 1.

        Returns:
            str, ``"#RRGGBBAA"`` if alpha is less than 1 and ``"#RRGGBB"``
            otherwise

        '''
        if self.a < 1.0:
            return f"#{self.r:02x}{self.g:02x}{self.b:02x}{round(self.a*255):02x}"
        else:
            return f"#{self.r:02x}{self.g:02x}{self.b:02x}"

    def to_hsl(self) -> HSL:
        ''' Return a corresponding HSL color for this RGB color.

        Returns:
            :class:`~bokeh.colors.HSL`

        '''
        h, l, s = colorsys.rgb_to_hls(float(self.r)/255, float(self.g)/255, float(self.b)/255)
        return HSL(round(h*360), s, l, self.a)

    def to_rgb(self) -> RGB:
        ''' Return a RGB copy for this RGB color.

        Returns:
            :class:`~bokeh.colors.RGB`

        '''
        return self.copy()

    @property
    def brightness(self) -> float:
        """ Perceived brightness of a color in [0, 1] range. """
        # http://alienryderflex.com/hsp.html
        r, g, b = self.r, self.g, self.b
        return sqrt(0.299*r**2 + 0.587*g**2 + 0.114*b**2)/255

    @property
    def luminance(self) -> float:
        """ Perceived luminance of a color in [0, 1] range. """
        # https://en.wikipedia.org/wiki/Relative_luminance
        r, g, b = self.r, self.g, self.b
        return (0.2126*r**2.2 + 0.7152*g**2.2 + 0.0722*b**2.2) / 255**2.2

class HSL(Color):
    ''' Represent colors by specifying their Hue, Saturation, and lightness.

    Alpha values may also optionally be provided. Otherwise, alpha values
    default to 1.

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
        self.h = h
        self.s = s
        self.l = l
        self.a = a

    def copy(self) -> HSL:
        ''' Return a copy of this color value.

        Returns:
            :class:`~bokeh.colors.HSL`

        '''
        return HSL(self.h, self.s, self.l, self.a)

    def darken(self, amount: float) -> HSL:
        ''' Darken (reduce the luminance) of this color.

        Args:
            amount (float) :
                Amount to reduce the luminance by (clamped above zero)

        Returns:
            :class:`~bokeh.colors.HSL`

        '''
        return self.lighten(-amount)

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
            value (:class:`~bokeh.colors.RGB`) :
                The RGB color to convert.

        Returns:
            :class:`~bokeh.colors.HSL`

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
            :class:`~bokeh.colors.HSL`

        '''
        return self.copy()

    def to_rgb(self) -> RGB:
        ''' Return a corresponding :class:`~bokeh.colors.RGB` color for
        this HSL color.

        Returns:
            :class:`~bokeh.colors.RGB`

        '''
        r, g, b = colorsys.hls_to_rgb(float(self.h)/360, self.l, self.s)
        return RGB(round(r*255), round(g*255), round(b*255), self.a)

    def lighten(self, amount: float) -> HSL:
        ''' Lighten (increase the luminance) of this color.

        Args:
            amount (float) :
                Amount to increase the luminance by (clamped above zero)

        Returns:
            :class:`~bokeh.colors.HSL`

        '''
        hsl = self.copy()
        hsl.l = self.clamp(hsl.l + amount, 1)
        return self.from_hsl(hsl)

ColorLike: TypeAlias = str | Color | RGBTuple

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
