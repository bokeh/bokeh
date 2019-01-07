#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

codes = {
    1000: ("MISSING_RENDERERS",   "Plot has no renderers"),
    1002: ("EMPTY_LAYOUT",        "Layout has no children"),
    1004: ("BOTH_CHILD_AND_ROOT", "Models should not be a document root if they are in a layout box"),
    1005: ("SLIDER_CALLBACK_APPLY_TO_CUSTOM_JS", "Callback policy currently apply to JS callbacks only"),
    9999: ("EXT",                 "Custom extension reports warning"),
}

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

for code in codes:
    exec("%s = %d" % (codes[code][0], code))
