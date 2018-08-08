#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide tools for executing Selenium tests.

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
import numpy as np

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def cds_data_almost_equal(data1, data2, rtol=1e-09, atol=0.0):
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
