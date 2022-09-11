#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' A version of the Auto MPG data set.

License: `CC0`_

Sourced from https://archive.ics.uci.edu/ml/datasets/auto+mpg

This module contains two pandas Dataframes: ``autompg`` and ``autompg_clean``.
The "clean" version has cleaned up the ``"mfr"`` and ``"origin"`` fields.

.. rubric:: ``autompg``

:bokeh-dataframe:`bokeh.sampledata.autompg.autompg`

.. rubric:: ``autompg_clean``

:bokeh-dataframe:`bokeh.sampledata.autompg.autompg_clean`

.. bokeh-sampledata-xref:: autompg
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
from typing import TYPE_CHECKING

# Bokeh imports
from ..util.sampledata import package_csv

if TYPE_CHECKING:
    import pandas as pd

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


def _clean_data(df: pd.DataFrame) -> pd.DataFrame:
    '''

    '''
    df = df.copy()
    df['mfr'] = [x.split()[0] for x in df.name]
    df.loc[df.mfr == 'chevy', 'mfr'] = 'chevrolet'
    df.loc[df.mfr == 'chevroelt', 'mfr'] = 'chevrolet'
    df.loc[df.mfr == 'maxda', 'mfr'] = 'mazda'
    df.loc[df.mfr == 'mercedes-benz', 'mfr'] = 'mercedes'
    df.loc[df.mfr == 'toyouta', 'mfr'] = 'toyota'
    df.loc[df.mfr == 'vokswagen', 'mfr'] = 'volkswagen'
    df.loc[df.mfr == 'vw', 'mfr'] = 'volkswagen'

    ORIGINS = ['North America', 'Europe', 'Asia']
    df.origin = [ORIGINS[x-1] for x in df.origin]

    return df

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

autompg = package_csv('autompg', 'auto-mpg.csv')

autompg_clean = _clean_data(autompg)
