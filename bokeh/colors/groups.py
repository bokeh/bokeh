#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Organize CSS named colors into useful groups according to general hue.

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

# Bokeh imports
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

    .. bokeh-color:: gainsboro
    .. bokeh-color:: lightgray
    .. bokeh-color:: silver
    .. bokeh-color:: darkgray
    .. bokeh-color:: gray
    .. bokeh-color:: dimgray
    .. bokeh-color:: lightslategray
    .. bokeh-color:: slategray
    .. bokeh-color:: darkslategray
    .. bokeh-color:: black
    '''
    _colors = ('Gainsboro', 'LightGray', 'Silver', 'DarkGray', 'Gray', 'DimGray', 'LightSlateGray',
               'SlateGray', 'DarkSlateGray', 'Black')

class blue(ColorGroup):
    ''' CSS "Blue" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    .. bokeh-color:: lightsteelblue
    .. bokeh-color:: powderblue
    .. bokeh-color:: lightblue
    .. bokeh-color:: skyblue
    .. bokeh-color:: lightskyblue
    .. bokeh-color:: deepskyblue
    .. bokeh-color:: dodgerblue
    .. bokeh-color:: cornflowerblue
    .. bokeh-color:: steelblue
    .. bokeh-color:: royalblue
    .. bokeh-color:: blue
    .. bokeh-color:: mediumblue
    .. bokeh-color:: darkblue
    .. bokeh-color:: navy
    .. bokeh-color:: midnightblue
    '''
    _colors = ('LightSteelBlue', 'PowderBlue', 'LightBlue', 'SkyBlue', 'LightSkyBlue', 'DeepSkyBlue', 'DodgerBlue',
               'CornflowerBlue', 'SteelBlue', 'RoyalBlue', 'Blue', 'MediumBlue', 'DarkBlue', 'Navy', 'MidnightBlue')

class brown(ColorGroup):
    ''' CSS "Brown" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    .. bokeh-color:: cornsilk
    .. bokeh-color:: blanchedalmond
    .. bokeh-color:: bisque
    .. bokeh-color:: navajowhite
    .. bokeh-color:: wheat
    .. bokeh-color:: burlywood
    .. bokeh-color:: tan
    .. bokeh-color:: rosybrown
    .. bokeh-color:: sandybrown
    .. bokeh-color:: goldenrod
    .. bokeh-color:: darkgoldenrod
    .. bokeh-color:: peru
    .. bokeh-color:: chocolate
    .. bokeh-color:: saddlebrown
    .. bokeh-color:: sienna
    .. bokeh-color:: brown
    .. bokeh-color:: maroon
    '''
    _colors = ('Cornsilk', 'BlanchedAlmond', 'Bisque', 'NavajoWhite', 'Wheat', 'BurlyWood', 'Tan',
               'RosyBrown', 'SandyBrown', 'Goldenrod', 'DarkGoldenrod', 'Peru', 'Chocolate',
               'SaddleBrown', 'Sienna', 'Brown', 'Maroon')

class cyan(ColorGroup):
    ''' CSS "Cyan" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    .. bokeh-color:: mediumaquamarine
    .. bokeh-color:: aqua
    .. bokeh-color:: cyan
    .. bokeh-color:: lightcyan
    .. bokeh-color:: paleturquoise
    .. bokeh-color:: aquamarine
    .. bokeh-color:: turquoise
    .. bokeh-color:: mediumturquoise
    .. bokeh-color:: darkturquoise
    .. bokeh-color:: lightseagreen
    .. bokeh-color:: cadetblue
    .. bokeh-color:: darkcyan
    .. bokeh-color:: teal
    '''
    _colors = ('MediumAquamarine', 'Aqua', 'Cyan', 'LightCyan', 'PaleTurquoise', 'Aquamarine', 'Turquoise',
               'MediumTurquoise', 'DarkTurquoise', 'LightSeaGreen', 'CadetBlue', 'DarkCyan', 'Teal')

class green(ColorGroup):
    ''' CSS "Green" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    .. bokeh-color:: darkolivegreen
    .. bokeh-color:: olive
    .. bokeh-color:: olivedrab
    .. bokeh-color:: yellowgreen
    .. bokeh-color:: limegreen
    .. bokeh-color:: lime
    .. bokeh-color:: lawngreen
    .. bokeh-color:: chartreuse
    .. bokeh-color:: greenyellow
    .. bokeh-color:: springgreen
    .. bokeh-color:: mediumspringgreen
    .. bokeh-color:: lightgreen
    .. bokeh-color:: palegreen
    .. bokeh-color:: darkseagreen
    .. bokeh-color:: mediumseagreen
    .. bokeh-color:: seagreen
    .. bokeh-color:: forestgreen
    .. bokeh-color:: green
    .. bokeh-color:: darkgreen
    '''
    _colors = ('DarkOliveGreen', 'Olive', 'OliveDrab', 'YellowGreen', 'LimeGreen', 'Lime', 'LawnGreen',
               'Chartreuse', 'GreenYellow', 'SpringGreen', 'MediumSpringGreen', 'LightGreen', 'PaleGreen',
               'DarkSeaGreen', 'MediumSeaGreen', 'SeaGreen', 'ForestGreen', 'Green', 'DarkGreen')

class orange(ColorGroup):
    ''' CSS "Orange" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    .. bokeh-color:: orangered
    .. bokeh-color:: tomato
    .. bokeh-color:: coral
    .. bokeh-color:: darkorange
    .. bokeh-color:: orange
    '''
    _colors = ('OrangeRed', 'Tomato', 'Coral', 'DarkOrange', 'Orange')

class pink(ColorGroup):
    ''' CSS "Pink" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    .. bokeh-color:: pink
    .. bokeh-color:: lightpink
    .. bokeh-color:: hotpink
    .. bokeh-color:: deeppink
    .. bokeh-color:: palevioletred
    .. bokeh-color:: mediumvioletred
    '''
    _colors = ('Pink', 'LightPink', 'HotPink', 'DeepPink', 'PaleVioletRed', 'MediumVioletRed')

class purple(ColorGroup):
    ''' CSS "Purple" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    .. bokeh-color:: lavender
    .. bokeh-color:: thistle
    .. bokeh-color:: plum
    .. bokeh-color:: violet
    .. bokeh-color:: orchid
    .. bokeh-color:: fuchsia
    .. bokeh-color:: magenta
    .. bokeh-color:: mediumorchid
    .. bokeh-color:: mediumpurple
    .. bokeh-color:: blueviolet
    .. bokeh-color:: darkviolet
    .. bokeh-color:: darkorchid
    .. bokeh-color:: darkmagenta
    .. bokeh-color:: purple
    .. bokeh-color:: indigo
    .. bokeh-color:: darkslateblue
    .. bokeh-color:: slateblue
    .. bokeh-color:: mediumslateblue
    '''
    _colors = ('Lavender', 'Thistle', 'Plum', 'Violet', 'Orchid', 'Fuchsia', 'Magenta', 'MediumOrchid',
               'MediumPurple', 'BlueViolet', 'DarkViolet', 'DarkOrchid', 'DarkMagenta', 'Purple', 'Indigo',
               'DarkSlateBlue', 'SlateBlue', 'MediumSlateBlue')

class red(ColorGroup):
    ''' CSS "Red" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    .. bokeh-color:: lightsalmon
    .. bokeh-color:: salmon
    .. bokeh-color:: darksalmon
    .. bokeh-color:: lightcoral
    .. bokeh-color:: indianred
    .. bokeh-color:: crimson
    .. bokeh-color:: firebrick
    .. bokeh-color:: darkred
    .. bokeh-color:: red
    '''
    _colors = ('LightSalmon', 'Salmon', 'DarkSalmon', 'LightCoral', 'IndianRed', 'Crimson', 'FireBrick', 'DarkRed', 'Red')

class white(ColorGroup):
    ''' CSS "White" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    .. bokeh-color:: white
    .. bokeh-color:: snow
    .. bokeh-color:: honeydew
    .. bokeh-color:: mintcream
    .. bokeh-color:: azure
    .. bokeh-color:: aliceblue
    .. bokeh-color:: ghostwhite
    .. bokeh-color:: whitesmoke
    .. bokeh-color:: seashell
    .. bokeh-color:: beige
    .. bokeh-color:: oldlace
    .. bokeh-color:: floralwhite
    .. bokeh-color:: ivory
    .. bokeh-color:: antiquewhite
    .. bokeh-color:: linen
    .. bokeh-color:: lavenderblush
    .. bokeh-color:: mistyrose
    '''
    _colors = ('White', 'Snow', 'Honeydew', 'MintCream', 'Azure', 'AliceBlue', 'GhostWhite', 'WhiteSmoke', 'Seashell',
               'Beige', 'OldLace', 'FloralWhite', 'Ivory', 'AntiqueWhite', 'Linen', 'LavenderBlush', 'MistyRose')

class yellow(ColorGroup):
    ''' CSS "Yellow" Color Group as defined by https://www.w3schools.com/colors/colors_groups.asp

    .. bokeh-color:: yellow
    .. bokeh-color:: lightyellow
    .. bokeh-color:: lemonchiffon
    .. bokeh-color:: lightgoldenrodyellow
    .. bokeh-color:: papayawhip
    .. bokeh-color:: moccasin
    .. bokeh-color:: peachpuff
    .. bokeh-color:: palegoldenrod
    .. bokeh-color:: khaki
    .. bokeh-color:: darkkhaki
    .. bokeh-color:: gold
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
