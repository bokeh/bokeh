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
