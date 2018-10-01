#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Organize CSS named colors into useful groups according to general hue.

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

# Bokeh imports
from ..util.string import format_docstring
from .util import ColorGroup

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'black',
    'blue',
    'brown',
    'cyan',
    'green',
    'orange',
    'pink',
    'purple',
    'red',
    'white',
    'yellow',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class black(ColorGroup):
    ''' CSS "Black" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('Gainsboro', 'LightGray', 'Silver', 'DarkGray', 'Gray', 'DimGray', 'LightSlateGray',
               'SlateGray', 'DarkSlateGray', 'Black')

class blue(ColorGroup):
    ''' CSS "Blue" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('LightSteelBlue', 'PowderBlue', 'LightBlue', 'SkyBlue', 'LightSkyBlue', 'DeepSkyBlue', 'DodgerBlue',
               'CornflowerBlue', 'SteelBlue', 'RoyalBlue', 'Blue', 'MediumBlue', 'DarkBlue', 'Navy', 'MidnightBlue')

class brown(ColorGroup):
    ''' CSS "Brown" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('Cornsilk', 'BlanchedAlmond', 'Bisque', 'NavajoWhite', 'Wheat', 'BurlyWood', 'Tan',
               'RosyBrown', 'SandyBrown', 'Goldenrod', 'DarkGoldenrod', 'Peru', 'Chocolate',
               'SaddleBrown', 'Sienna', 'Brown', 'Maroon')

class cyan(ColorGroup):
    ''' CSS "Cyan" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('MediumAquamarine', 'Aqua', 'Cyan', 'LightCyan', 'PaleTurquoise', 'Aquamarine', 'Turquoise',
               'MediumTurquoise', 'DarkTurquoise', 'LightSeaGreen', 'CadetBlue', 'DarkCyan', 'Teal')

class green(ColorGroup):
    ''' CSS "Green" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('DarkOliveGreen', 'Olive', 'OliveDrab', 'YellowGreen', 'LimeGreen', 'Lime', 'LawnGreen',
               'Chartreuse', 'GreenYellow', 'SpringGreen', 'MediumSpringGreen', 'LightGreen', 'PaleGreen',
               'DarkSeaGreen', 'MediumSeaGreen', 'SeaGreen', 'ForestGreen', 'Green', 'DarkGreen')

class orange(ColorGroup):
    ''' CSS "Orange" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('OrangeRed', 'Tomato', 'Coral', 'DarkOrange', 'Orange')

class pink(ColorGroup):
    ''' CSS "Pink" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('Pink', 'LightPink', 'HotPink', 'DeepPink', 'PaleVioletRed', 'MediumVioletRed')

class purple(ColorGroup):
    ''' CSS "Purple" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('Lavender', 'Thistle', 'Plum', 'Violet', 'Orchid', 'Fuchsia', 'Magenta', 'MediumOrchid',
               'MediumPurple', 'BlueViolet', 'DarkViolet', 'DarkOrchid', 'DarkMagenta', 'Purple', 'Indigo',
               'DarkSlateBlue', 'SlateBlue', 'MediumSlateBlue')

class red(ColorGroup):
    ''' CSS "Red" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('LightSalmon', 'Salmon', 'DarkSalmon', 'LightCoral', 'IndianRed', 'Crimson', 'FireBrick', 'DarkRed', 'Red')

class white(ColorGroup):
    ''' CSS "White" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('White', 'Snow', 'Honeydew', 'MintCream', 'Azure', 'AliceBlue', 'GhostWhite', 'WhiteSmoke', 'Seashell',
               'Beige', 'OldLace', 'FloralWhite', 'Ivory', 'AntiqueWhite', 'Linen', 'LavenderBlush', 'MistyRose')

class yellow(ColorGroup):
    ''' CSS "Yellow" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('Yellow', 'LightYellow', 'LemonChiffon', 'LightGoldenrodYellow', 'PapayaWhip',
               'Moccasin', 'PeachPuff', 'PaleGoldenrod', 'Khaki', 'DarkKhaki', 'Gold')

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

color_groups = (
    black,
    blue,
    brown,
    cyan,
    green,
    orange,
    pink,
    purple,
    red,
    white,
    yellow,
)

for color_group in color_groups:
    color_group.__doc__ = format_docstring(color_group.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in color_group._colors))

# black.__doc__ = format_docstring(black.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in black._colors))
# blue.__doc__ = format_docstring(blue.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in blue._colors))
# brown.__doc__ = format_docstring(brown.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in brown._colors))
# cyan.__doc__ = format_docstring(cyan.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in cyan._colors))
# green.__doc__ = format_docstring(green.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in green._colors))
# orange.__doc__ = format_docstring(orange.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in orange._colors))
# pink.__doc__ = format_docstring(pink.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in pink._colors))
# purple.__doc__ = format_docstring(purple.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in purple._colors))
# red.__doc__ = format_docstring(red.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in red._colors))
# white.__doc__ = format_docstring(white.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in white._colors))
# yellow.__doc__ = format_docstring(yellow.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in yellow._colors))