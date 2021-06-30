#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Module under test
import bokeh.colors.groups as bcg # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

_pink = (
    'Pink',
    'LightPink',
    'HotPink',
    'DeepPink',
    'PaleVioletRed',
    'MediumVioletRed',
)

_red = (
    'LightSalmon',
    'Salmon',
    'DarkSalmon',
    'LightCoral',
    'IndianRed',
    'Crimson',
    'FireBrick',
    'DarkRed',
    'Red',
)

_orange = (
    'OrangeRed',
    'Tomato',
    'Coral',
    'DarkOrange',
    'Orange',
)

_yellow = (
    'Yellow',
    'LightYellow',
    'LemonChiffon',
    'LightGoldenrodYellow',
    'PapayaWhip',
    'Moccasin',
    'PeachPuff',
    'PaleGoldenrod',
    'Khaki',
    'DarkKhaki',
    'Gold',
)

_brown = (
    'Cornsilk',
    'BlanchedAlmond',
    'Bisque',
    'NavajoWhite',
    'Wheat',
    'BurlyWood',
    'Tan',
    'RosyBrown',
    'SandyBrown',
    'Goldenrod',
    'DarkGoldenrod',
    'Peru',
    'Chocolate',
    'SaddleBrown',
    'Sienna',
    'Brown',
    'Maroon',
)

_green = (
    'DarkOliveGreen',
    'Olive',
    'OliveDrab',
    'YellowGreen',
    'LimeGreen',
    'Lime',
    'LawnGreen',
    'Chartreuse',
    'GreenYellow',
    'SpringGreen',
    'MediumSpringGreen',
    'LightGreen',
    'PaleGreen',
    'DarkSeaGreen',
    'MediumSeaGreen',
    'SeaGreen',
    'ForestGreen',
    'Green',
    'DarkGreen',
)

_cyan  = (
    'MediumAquamarine',
    'Aqua',
    'Cyan',
    'LightCyan',
    'PaleTurquoise',
    'Aquamarine',
    'Turquoise',
    'MediumTurquoise',
    'DarkTurquoise',
    'LightSeaGreen',
    'CadetBlue',
    'DarkCyan',
    'Teal',
)

_blue  = (
    'LightSteelBlue',
    'PowderBlue',
    'LightBlue',
    'SkyBlue',
    'LightSkyBlue',
    'DeepSkyBlue',
    'DodgerBlue',
    'CornflowerBlue',
    'SteelBlue',
    'RoyalBlue',
    'Blue',
    'MediumBlue',
    'DarkBlue',
    'Navy',
    'MidnightBlue',
)

_purple = (
    'Lavender',
    'Thistle',
    'Plum',
    'Violet',
    'Orchid',
    'Fuchsia',
    'Magenta',
    'MediumOrchid',
    'MediumPurple',
    'BlueViolet',
    'DarkViolet',
    'DarkOrchid',
    'DarkMagenta',
    'Purple',
    'Indigo',
    'DarkSlateBlue',
    'SlateBlue',
    'MediumSlateBlue',
)

_white = (
    'White',
    'Snow',
    'Honeydew',
    'MintCream',
    'Azure',
    'AliceBlue',
    'GhostWhite',
    'WhiteSmoke',
    'Seashell',
    'Beige',
    'OldLace',
    'FloralWhite',
    'Ivory',
    'AntiqueWhite',
    'Linen',
    'LavenderBlush',
    'MistyRose',
)

_black = (
    'Gainsboro',
    'LightGray',
    'Silver',
    'DarkGray',
    'Gray',
    'DimGray',
    'LightSlateGray',
    'SlateGray',
    'DarkSlateGray',
    'Black',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test__all__() -> None:
    assert bcg.__all__ == ('black', 'blue', 'brown', 'cyan', 'green', 'orange', 'pink', 'purple', 'red', 'white', 'yellow')

@pytest.mark.parametrize('group', bcg.__all__)
def test_color(group: bcg.ColorGroup) -> None:
    assert group in bcg.__all__
    g = getattr(bcg, group)
    ref = globals().get("_"+group)
    assert len(g) == len(ref)
    for x in ref:
        assert getattr(g, x, None) is not None

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
