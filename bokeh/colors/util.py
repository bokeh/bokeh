#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
    def find(cls, name: str) -> NamedColor:
        # If name not recognised, raises ValueError
        index = cls.__all__.index(name)
        return cls.colors[index]

    def to_css(self) -> str:
        '''

        '''
        return self.name

def _color_as_rgb_hex(color: str) -> str:
    ''' Convert string color to RGB hex string.

    Color may be a named color such as "blue", or a hex RGB(A) string such as
    "#FFAA00", "#FFAA00FF", "#FA0" or "#FA0F". Returned string is always of
    the form "#RRGGBB" with 2 characters for each of the R, G and B components
    and no alpha component.

    '''

    if color.startswith("#"):
        if len(color) in (7, 9):
            return color[:7].upper()
        elif len(color) in (4, 5):
            return f"#{color[1]*2}{color[2]*2}{color[3]*2}".upper()
        else:
            raise ValueError(f"Unable to parse hex color string: '{color}'")
    try:
        return NamedColor.find(color).to_hex()
    except ValueError:
        raise ValueError(f"Color '{color}' must be either a named color or a hex RGB(A) string")

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
