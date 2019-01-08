#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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
from ..core.has_props import abstract
from .transforms import Transform

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CategoricalScale',
    'LinearScale',
    'LogScale',
    'Scale',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Scale(Transform):
    ''' Base class for ``Scale`` models that represent an invertible
    computation to be carried out on the client-side.

    JavaScript implementations should implement the following methods:

    .. code-block:: coffeescript

        compute: (x) ->
            # compute the transform of a single value

        v_compute: (xs) ->
            # compute the transform of an array of values

        invert: (xprime) ->
            # compute the inverse transform of a single value

        v_invert: (xprimes) ->
            # compute the inverse transform of an array of values

    '''
    pass

class LinearScale(Scale):
    '''

    '''
    pass

class LogScale(Scale):
    '''

    '''
    pass

class CategoricalScale(LinearScale):
    '''

    '''
    pass

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
