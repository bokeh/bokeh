#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' These define the standard warning codes and messages for Bokeh
validation checks.

1000 *(MISSING_RENDERERS)*
    A |Plot| object has no renderers configured (will result in a blank plot).

1002 *(EMPTY_LAYOUT)*
    A layout model has no children (will result in a blank layout).

1004 *(BOTH_CHILD_AND_ROOT)*
    Each component can be rendered in only one place, can't be both a root and in a layout.

9999 *(EXT)*
    Indicates that a custom warning check has failed.

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
from .issue import Warning

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

MISSING_RENDERERS = Warning(
    1000,
    "MISSING_RENDERERS",
    "Plot has no renderers")
EMPTY_LAYOUT = Warning(
    1002,
    "EMPTY_LAYOUT",
    "Layout has no children")
BOTH_CHILD_AND_ROOT = Warning(
    1004,
    "BOTH_CHILD_AND_ROOT",
    "Models should not be a document root if they are in a layout box")
FIXED_SIZING_MODE = Warning(
    1005,
    "FIXED_SIZING_MODE",
    "'fixed' sizing mode requires width and height to be set")
FIXED_WIDTH_POLICY = Warning(
    1006,
    "FIXED_WIDTH_POLICY",
    "'fixed' width policy requires width to be set")
FIXED_HEIGHT_POLICY = Warning(
    1007,
    "FIXED_HEIGHT_POLICY",
    "'fixed' height policy requires height to be set")
PALETTE_LENGTH_FACTORS_MISMATCH = Warning(
    1008,
    "PALETTE_LENGTH_FACTORS_MISMATCH",
    "Palette length does not match number of factors")
EXT = Warning(
    9999,
    "EXT",
    "Custom extension reports warning")

__all__ = ()

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
