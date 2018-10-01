#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Internal utility functions and classes for implementing ``bokeh.colors``.

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

# External imports
from six import string_types

# Bokeh imports
from ..util.future import with_metaclass
from .rgb import RGB

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

    When Python2 support is dropped, this will no longer be necessary.

    '''
    def __len__(self):
        return len(self._colors)

    def __getitem__(self, v):
        from . import named
        if isinstance(v, string_types):
            if v in self._colors:
                return getattr(named, v.lower())
            raise KeyError("Color group %r has no color %r" % (self.__class__.__name__, v))
        if isinstance(v, int):
            if v >= 0 and v < len(self):
                return getattr(named, self._colors[v].lower())
            raise IndexError("Index out of range for color group %r" % self.__class__.__name__)
        raise ValueError("Unknown index %r for color group %r" % (v, self.__class__.__name__))

    def __iter__(self):
        from . import named
        return (getattr(named, x.lower()) for x in self._colors)

    def __getattr__(self, v):
        from . import named
        if v is not "_colors" and v in self._colors:
            return getattr(named, v.lower())
        return super(_ColorGroupMeta, self).__getattr__(v)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class ColorGroup(with_metaclass(_ColorGroupMeta)):
    ''' Collect a group of named colors into an iterable, indexable group.

    '''

class NamedColor(RGB):
    ''' Represent a CSS named color, provided as RGB values.

    Instances of this class also record the name of the created color, which
    is used to populate the Bokeh enum for named colors.

    '''

    __all__ = []

    def __init__(self, name, r, g, b):
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

        self.name = name
        super(NamedColor, self).__init__(r, g, b)

    def to_css(self):
        '''

        '''
        return self.name

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
