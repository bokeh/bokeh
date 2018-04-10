#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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
from ..util.sampledata import package_csv

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'autompg',
    'autompg_clean',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------


def _clean_data(df):
    '''

    '''
    df = df.copy()
    df['mfr'] = [x.split()[0] for x in df.name]
    df.loc[df.mfr=='chevy', 'mfr'] = 'chevrolet'
    df.loc[df.mfr=='chevroelt', 'mfr'] = 'chevrolet'
    df.loc[df.mfr=='maxda', 'mfr'] = 'mazda'
    df.loc[df.mfr=='mercedes-benz', 'mfr'] = 'mercedes'
    df.loc[df.mfr=='toyouta', 'mfr'] = 'toyota'
    df.loc[df.mfr=='vokswagen', 'mfr'] = 'volkswagen'
    df.loc[df.mfr=='vw', 'mfr'] = 'volkswagen'

    ORIGINS = ['North America', 'Europe', 'Asia']
    df.origin = [ORIGINS[x-1] for x in df.origin]

    return df

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

autompg = package_csv('autompg', 'auto-mpg.csv')

autompg_clean = _clean_data(autompg)
