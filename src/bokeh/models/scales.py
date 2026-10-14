#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportAbstractUsage=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# Bokeh imports
from ..core.has_props import abstract
from ..core.property.instance import Instance
from ..core.property.required import Required
from .transforms import Transform

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CategoricalScale',
    'CompositeScale',
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

    .. code-block:: typescript

        compute(x: number): number {
            // compute and return the transform of a single value
        }

        v_compute(xs: Arrayable<number>): Arrayable<number> {
            // compute and return the transform of an array of values
        }

        invert(sx: number): number {
            // compute and return the inverse transform of a single value
        }

        v_invert(sxs: Arrayable<number>): Arrayable<number> {
            // compute and return the inverse transform of an array of values
        }

    '''


class ContinuousScale(Scale):
    ''' Represent a scale transformation between continuous ranges.

    '''


class LinearScale(ContinuousScale):
    ''' Represent a linear scale transformation between continuous ranges.

    '''

class LogScale(ContinuousScale):
    ''' Represent a log scale transformation between continuous ranges.

    '''

class CategoricalScale(Scale):
    ''' Represent a scale transformation between a categorical source range and
    continuous target range.

    '''

class CompositeScale(Scale):
    ''' Represent a composition of two scales, which useful for defining
    sub-coordinate systems.

    '''

    source_scale = Required(Instance(Scale), help="""
    The source scale.
    """)

    target_scale = Required(Instance(Scale), help="""
    The target scale.
    """)

    # TODO assert source_scale != target_scale

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
