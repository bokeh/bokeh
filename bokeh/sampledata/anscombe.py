#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' The four data series that comprise `Anscombe's Quartet`_.

License: `CC BY-SA 3.0`_

Sourced from: https://en.wikipedia.org/wiki/Anscombe%27s_quartet

This module contains one pandas Dataframe: ``data``.

.. rubric:: ``data``

:bokeh-dataframe:`bokeh.sampledata.anscombe.data`

.. bokeh-sampledata-xref:: anscombe

.. _Anscombe's Quartet: https://en.wikipedia.org/wiki/Anscombe%27s_quartet
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
from io import StringIO
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pandas import DataFrame

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'data',
)

CSV = """
  Ix,    Iy,     IIx,    IIy,   IIIx,   IIIy,   IVx,     IVy
10.0,   8.04,   10.0,   9.14,   10.0,   7.46,   8.0,    6.58
 8.0,   6.95,    8.0,   8.14,    8.0,   6.77,   8.0,    5.76
13.0,   7.58,   13.0,   8.74,   13.0,  12.74,   8.0,    7.71
 9.0,   8.81,    9.0,   8.77,    9.0,   7.11,   8.0,    8.84
11.0,   8.33,   11.0,   9.26,   11.0,   7.81,   8.0,    8.47
14.0,   9.96,   14.0,   8.10,   14.0,   8.84,   8.0,    7.04
 6.0,   7.24,    6.0,   6.13,    6.0,   6.08,   8.0,    5.25
 4.0,   4.26,    4.0,   3.10,    4.0,   5.39,  19.0,   12.50
12.0,  10.84,   12.0,   9.13,   12.0,   8.15,   8.0,    5.56
 7.0,   4.82,    7.0,   7.26,    7.0,   6.42,   8.0,    7.91
 5.0,   5.68,    5.0,   4.74,    5.0,   5.73,   8.0,    6.89
"""

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _read_data() -> DataFrame:
    '''

    '''
    from ..util.dependencies import import_required
    pd = import_required('pandas', 'anscombe sample data requires Pandas (http://pandas.pydata.org) to be installed')
    return pd.read_csv(StringIO(CSV), skiprows=1, skipinitialspace=True, engine='python')

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
