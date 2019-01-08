#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide Bokeh-specific warning subclasses.

The primary use of these subclasses to to force them to be unconditionally
displayed to users by default.

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

__all__ = (
    'BokehDeprecationWarning',
    'BokehUserWarning',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class BokehDeprecationWarning(DeprecationWarning):
    ''' A Bokeh-specific ``DeprecationWarning`` subclass.

    Used to selectively filter Bokeh deprecations for unconditional display.

    '''

class BokehUserWarning(UserWarning):
    ''' A Bokeh-specific ``UserWarning`` subclass.

    Used to selectively filter Bokeh warnings for unconditional display.

    '''

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
