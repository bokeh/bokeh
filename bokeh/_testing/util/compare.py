#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide tools for executing Selenium tests.

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
from typing import (
    Any,
    Dict,
    Sequence,
    Union,
)

# External imports
import numpy as np
import numpy.typing as npt

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'cds_data_almost_equal',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Num = Union[int, float]
Data = Dict[str,
    Union[
        Sequence[Num],
        Sequence[Sequence[Num]],
        npt.NDArray[Any],         # XXX: figure out how to type this properly (numpy >= 1.21)
    ],
]

def cds_data_almost_equal(data1: Data, data2: Data, rtol: float = 1e-09, atol: float = 0.0) -> bool:
    '''Compares data dictionaries containing floats, lists and arrays
    Also supports nested lists and arrays
    '''
    if sorted(data1.keys()) != sorted(data2.keys()):
        return False
    for c in data1.keys():
        cd1 = data1[c]
        cd2 = data2[c]
        if len(cd1) != len(cd2):
            return False
        for v1, v2 in zip(cd1, cd2):
            if isinstance(v1, (float, int)) and isinstance(v2, (float, int)):
                if not np.isclose(v1, v2, rtol, atol):
                    return False
            elif isinstance(v1, (list, np.ndarray)) and isinstance(v2, (list, np.ndarray)):
                v1, v2 = np.asarray(v1), np.asarray(v2)
                if v1.dtype.kind in 'iufcmM' and v2.dtype.kind in 'iufcmM':
                    if (~np.isclose(v1, v2, rtol, atol)).any():
                        return False
                elif (v1 != v2).any():
                    return False
            elif v1 != v2:
                return False
    return True

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
