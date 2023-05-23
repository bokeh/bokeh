#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Time series of commits for a GitHub user between 2012 and 2016.

License: `Public Domain`_

This module contains one pandas Dataframe: ``data``.

.. rubric:: ``data``

:bokeh-dataframe:`bokeh.sampledata.commits.data`

.. bokeh-sampledata-xref:: commits
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
from typing import TYPE_CHECKING, Any, cast

# Bokeh imports
from ..util.sampledata import package_csv

if TYPE_CHECKING:
    import pandas as pd

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'data',
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

def _read_data() -> pd.DataFrame:
    '''

    '''
    import pandas as pd

    data = package_csv('commits', 'commits.txt.gz', parse_dates=True, header=None, names=['day', 'datetime'], index_col='datetime')
    data.index = cast(Any, pd.to_datetime(data.index, utc=True).tz_convert('US/Central'))
    data['time'] = data.index.time # type: ignore[attr-defined]

    return data

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
