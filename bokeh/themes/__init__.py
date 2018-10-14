#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide access to built-in themes:

'''
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from . import _caliber, _dark_minimal, _light_minimal
from .theme import Theme

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CALIBER',
    'DARK_MINIMAL',
    'LIGHT_MINIMAL',
    'Theme',
    'built_in_themes',
    'default',
)

CALIBER       = 'caliber'
LIGHT_MINIMAL = 'light_minimal'
DARK_MINIMAL  = 'dark_minimal'

default = Theme(json={})

built_in_themes = {
    CALIBER       : Theme(json=_caliber.json),
    DARK_MINIMAL  : Theme(json=_dark_minimal.json),
    LIGHT_MINIMAL : Theme(json=_caliber.json),
}

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
#----------------------------------------------------------------------------
