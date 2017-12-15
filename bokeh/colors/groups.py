#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
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

from bokeh.util.api import general, dev ; general, dev

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

class pink(ColorGroup):
    ''' CSS "Pink" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('Pink', 'LightPink', 'HotPink', 'DeepPink', 'PaleVioletRed', 'MediumVioletRed')
pink.__doc__ = format_docstring(pink.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in pink._colors))

class red(ColorGroup):
    ''' CSS "Red" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('LightSalmon', 'Salmon', 'DarkSalmon', 'LightCoral', 'IndianRed', 'Crimson', 'FireBrick', 'DarkRed', 'Red')
red.__doc__ = format_docstring(red.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in red._colors))

class orange(ColorGroup):
    ''' CSS "Orange" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('OrangeRed', 'Tomato', 'Coral', 'DarkOrange', 'Orange')
orange.__doc__ = format_docstring(orange.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in orange._colors))

class yellow(ColorGroup):
    ''' CSS "Yellow" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('Yellow', 'LightYellow', 'LemonChiffon', 'LightGoldenrodYellow', 'PapayaWhip',
               'Moccasin', 'PeachPuff', 'PaleGoldenrod', 'Khaki', 'DarkKhaki', 'Gold')
yellow.__doc__ = format_docstring(yellow.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in yellow._colors))

class brown(ColorGroup):
    ''' CSS "Brown" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('Cornsilk', 'BlanchedAlmond', 'Bisque', 'NavajoWhite', 'Wheat', 'BurlyWood', 'Tan',
               'RosyBrown', 'SandyBrown', 'Goldenrod', 'DarkGoldenrod', 'Peru', 'Chocolate',
               'SaddleBrown', 'Sienna', 'Brown', 'Maroon')

class green(ColorGroup):
    ''' CSS "Green" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('DarkOliveGreen', 'Olive', 'OliveDrab', 'YellowGreen', 'LimeGreen', 'Lime', 'LawnGreen',
               'Chartreuse', 'GreenYellow', 'SpringGreen', 'MediumSpringGreen', 'LightGreen', 'PaleGreen',
               'DarkSeaGreen', 'MediumSeaGreen', 'SeaGreen', 'ForestGreen', 'Green', 'DarkGreen')
green.__doc__ = format_docstring(green.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in green._colors))

class cyan(ColorGroup):
    ''' CSS "Cyan" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('MediumAquamarine', 'Aqua', 'Cyan', 'LightCyan', 'PaleTurquoise', 'Aquamarine', 'Turquoise',
               'MediumTurquoise', 'DarkTurquoise', 'LightSeaGreen', 'CadetBlue', 'DarkCyan', 'Teal')
cyan.__doc__ = format_docstring(cyan.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in cyan._colors))

class blue(ColorGroup):
    ''' CSS "Blue" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('LightSteelBlue', 'PowderBlue', 'LightBlue', 'SkyBlue', 'LightSkyBlue', 'DeepSkyBlue', 'DodgerBlue',
               'CornflowerBlue', 'SteelBlue', 'RoyalBlue', 'Blue', 'MediumBlue', 'DarkBlue', 'Navy', 'MidnightBlue')
blue.__doc__ = format_docstring(blue.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in blue._colors))

class purple(ColorGroup):
    ''' CSS "Purple" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('Lavender', 'Thistle', 'Plum', 'Violet', 'Orchid', 'Fuchsia', 'Magenta', 'MediumOrchid',
               'MediumPurple', 'BlueViolet', 'DarkViolet', 'DarkOrchid', 'DarkMagenta', 'Purple', 'Indigo',
               'DarkSlateBlue', 'SlateBlue', 'MediumSlateBlue')
purple.__doc__ = format_docstring(purple.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in purple._colors))

class white(ColorGroup):
    ''' CSS "White" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('White', 'Snow', 'Honeydew', 'MintCream', 'Azure', 'AliceBlue', 'GhostWhite', 'WhiteSmoke', 'Seashell',
               'Beige', 'OldLace', 'FloralWhite', 'Ivory', 'AntiqueWhite', 'Linen', 'LavenderBlush', 'MistyRose')
white.__doc__ = format_docstring(white.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in white._colors))

class black(ColorGroup):
    ''' CSS "Black" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    {colors}
    '''
    _colors = ('Gainsboro', 'LightGray', 'Silver', 'DarkGray', 'Gray', 'DimGray', 'LightSlateGray',
               'SlateGray', 'DarkSlateGray', 'Black')
black.__doc__ = format_docstring(black.__doc__, colors="\n    ".join(".. bokeh-color:: %s" % str(x).lower() for x in black._colors))

__all__ = ('pink', 'red', 'orange', 'yellow', 'brown', 'green', 'cyan', 'blue', 'purple', 'white', 'black')

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
