#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from . import (
    _caliber,
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

CALIBER       = 'caliber'
LIGHT_MINIMAL = 'light_minimal'
DARK_MINIMAL  = 'dark_minimal'
NIGHT_SKY  = 'night_sky'
CONTRAST  = 'contrast'

default = Theme(json={})

built_in_themes = {
    CALIBER       : Theme(json=_caliber.json),
    DARK_MINIMAL  : Theme(json=_dark_minimal.json),
    LIGHT_MINIMAL : Theme(json=_caliber.json),
    NIGHT_SKY : Theme(json=_night_sky.json),
    CONTRAST : Theme(json=_contrast.json),
}

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#----------------------------------------------------------------------------
