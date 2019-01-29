#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.colors import RGB, HSL
from bokeh.util.logconfig import basicConfig

# Module under test
from bokeh.models.widgets.inputs import ColorPicker

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

# needed for caplog tests to function
basicConfig()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


def test_colorpick_type_of_color():
    valid_colors = [RGB(255, 0, 0),
                    HSL(0, 1, 0.5),
                    '#ff0000',
                    'red',
                    (255, 0, 0)]
    invalid_color = 'aliceblu'
    # all colors should be red and converted in #FF0000
    hex_valid_colors = [ColorPicker(color=color).color for color in valid_colors]
    assert all([color == hex_valid_colors[0] for color in hex_valid_colors])
    with pytest.raises(ValueError):
        ColorPicker(color=invalid_color)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
