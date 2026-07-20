#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide access to built-in themes:

Built-in themes
---------------

CALIBER
~~~~~~~

.. bokeh-plot:: __REPO__/examples/styling/themes/caliber.py

CARBON
~~~~~~

.. bokeh-plot:: __REPO__/examples/styling/themes/carbon.py

DARK_MINIMAL
~~~~~~~~~~~~

.. bokeh-plot:: __REPO__/examples/styling/themes/dark_minimal.py

LIGHT_MINIMAL
~~~~~~~~~~~~~

.. bokeh-plot:: __REPO__/examples/styling/themes/light_minimal.py

NIGHT_SKY
~~~~~~~~~

.. bokeh-plot:: __REPO__/examples/styling/themes/night_sky.py

CONTRAST
~~~~~~~~

.. bokeh-plot:: __REPO__/examples/styling/themes/contrast.py

Theme
-----

.. autoclass:: Theme

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
from typing import Literal

# Bokeh imports
from . import (
    _caliber,
    _carbon,
    _contrast,
    _dark_minimal,
    _light_minimal,
    _night_sky,
)
from .theme import Theme

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CALIBER',
    'CARBON',
    'DARK_MINIMAL',
    'LIGHT_MINIMAL',
    'NIGHT_SKY',
    'CONTRAST',
    'Theme',
    'built_in_themes',
    'default',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

CALIBER      : Literal['caliber']       = 'caliber'
CARBON       : Literal['carbon']        = 'carbon'
LIGHT_MINIMAL: Literal['light_minimal'] = 'light_minimal'
DARK_MINIMAL : Literal['dark_minimal']  = 'dark_minimal'
NIGHT_SKY    : Literal['night_sky']     = 'night_sky'
CONTRAST     : Literal['contrast']      = 'contrast'

type BuiltinThemeName = Literal['caliber', 'carbon', 'light_minimal', 'dark_minimal', 'night_sky', 'contrast']

built_in_themes: dict[BuiltinThemeName, Theme] = {
    CALIBER       : Theme(json=_caliber.json),
    CARBON        : Theme(json=_carbon.json),
    DARK_MINIMAL  : Theme(json=_dark_minimal.json),
    LIGHT_MINIMAL : Theme(json=_light_minimal.json),
    NIGHT_SKY     : Theme(json=_night_sky.json),
    CONTRAST      : Theme(json=_contrast.json),
}

default = Theme(json={})

type ThemeLike = None | Theme | BuiltinThemeName

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#----------------------------------------------------------------------------
