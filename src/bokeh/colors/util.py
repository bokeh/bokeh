#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Internal utility functions and classes for implementing ``bokeh.colors``.

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
from typing import ClassVar, Iterator

# Bokeh imports
from .color import RGB

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ColorGroup',
    'NamedColor',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class _ColorGroupMeta(type):
    ''' This metaclass enables ColorGroup class types to be used like simple
    enumerations.

    '''
    _colors: tuple[str, ...]

    def __len__(self) -> int:
        return len(self._colors)

    def __getitem__(self, v: str | int) -> NamedColor:
        from . import named
        if isinstance(v, str):
            if v in self._colors:
                return getattr(named, v.lower())
            raise KeyError(f"Color group {self.__class__.__name__!r} has no color {v!r}" )
        if isinstance(v, int):
            if v >= 0 and v < len(self):
                return getattr(named, self._colors[v].lower())
            raise IndexError(f"Index out of range for color group {self.__class__.__name__!r}")
        raise ValueError(f"Unknown index {v!r} for color group {self.__class__.__name__!r}")

    def __iter__(self) -> Iterator[NamedColor]:
        from . import named
        return (getattr(named, x.lower()) for x in self._colors)

    def __getattr__(self, v: str) -> NamedColor:
        from . import named
        if v != "_colors" and v in self._colors:
            return getattr(named, v.lower())
        return getattr(type, v)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class ColorGroup(metaclass=_ColorGroupMeta):
    ''' Collect a group of named colors into an iterable, indexable group.

    '''

class NamedColor(RGB):
    ''' Represent a CSS named color, provided as RGB values.

    Instances of this class also record the name of the created color, which
    is used to populate the Bokeh enum for named colors.

    '''

    __all__: ClassVar[list[str]] = []
    colors: ClassVar[list[NamedColor]] = []

    def __init__(self, name: str, r: int, g: int, b: int) -> None:
        '''

        Args:
            name (str) :
                The name to associate with the color, e.g. "firebrick"

            r (int) :
                The value for the red channel in [0, 255]

            g (int) :
                The value for the green channel in [0, 255]

            b (int) :
                The value for the blue channel in [0, 255]

        '''
        if name not in self.__all__:
            self.__all__.append(name)
            self.colors.append(self)

        self.name = name
        super().__init__(r, g, b)

    @classmethod
    def find(cls, name: str) -> NamedColor | None:
        ''' Find and return a named color.

        Args:
            name (str) : Name of color to find.

        Returns:
            :class:`~bokeh.colors.NamedColor` or None if the name is not
            recognised.

        '''
        try:
            index = cls.__all__.index(name)
        except ValueError:
            return None
        return cls.colors[index]

    @classmethod
    def from_string(cls, color: str) -> RGB:
        ''' Create an RGB color from a string.

        Args:
            color (str) :
                String containing color. This may be a named color such as
                "blue" or a hex RGB(A) string of one of the following formats:
                '#rrggbb', '#rrggbbaa', '#rgb' or '#rgba'.

        Returns:
            :class:`~bokeh.colors.RGB`

        '''

        try:
            # Is it a hex string?
            return RGB.from_hex_string(color)
        except ValueError:
            # Is it a named color?
            rgb = cls.find(color)

            if rgb is None:
                raise ValueError(f"Color '{color}' must be either a named color or an RGB(A) hex string")

            return rgb

    def to_css(self) -> str:
        '''

        '''
        return self.name

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
