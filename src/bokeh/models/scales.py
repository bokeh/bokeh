#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.has_props import abstract
from ..core.properties import Instance, Required
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

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class ContinuousScale(Scale):
    ''' Represent a scale transformation between continuous ranges.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class LinearScale(ContinuousScale):
    ''' Represent a linear scale transformation between continuous ranges.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class LogScale(ContinuousScale):
    ''' Represent a log scale transformation between continuous ranges.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class CategoricalScale(Scale):
    ''' Represent a scale transformation between a categorical source range and
    continuous target range.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class CompositeScale(Scale):
    ''' Represent a composition of two scales, which useful for defining
    sub-coordinate systems.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

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
