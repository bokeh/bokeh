#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

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

    .. code-block

        compute(x: number): number {
            # compute and return the transform of a single value
        }

        v_compute(xs: Arrayable<number>): Arrayable<number> {
            # compute and return the transform of an array of values
        }

        invert(sx: number): number {
            # compute and return the inverse transform of a single value
        }

        v_invert(sxs: Arrayable<number>): Arrayable<number> {
            # compute and return the inverse transform of an array of values
        }

    '''
    pass

class ContinuousScale(Scale):
    ''' Represent a scale transformation between continuous ranges.

    '''
    pass


class LinearScale(ContinuousScale):
    ''' Represent a linear scale transformation between continuous ranges.

    '''
    pass

class LogScale(ContinuousScale):
    ''' Represent a log scale transformation between continuous ranges.

    '''
    pass

class CategoricalScale(Scale):
    ''' Represent a scale transformation between a categorical source range and
    continuous target range.

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
