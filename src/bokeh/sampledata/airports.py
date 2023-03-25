#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' US airports with field elevations > 1500 meters.

License: `Public Domain`_

Sourced from USGS service http://services.nationalmap.gov on October 15, 2015.

This module contains one pandas Dataframe: ``data``.

.. rubric:: ``data``

:bokeh-dataframe:`bokeh.sampledata.airports.data`

.. bokeh-sampledata-xref:: airports
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
import json
from typing import TYPE_CHECKING, Any

# Bokeh imports
from ..util.sampledata import external_path

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
    with open(external_path('airports.json')) as f:
        content = f.read()
        airports = json.loads(content)
        schema: Any = [['attributes', 'nam'], ['attributes', 'zv3'], ['geometry', 'x'], ['geometry', 'y']]
        data = pd.json_normalize(airports['features'], meta=schema)
        data.rename(columns={'attributes.nam': 'name', 'attributes.zv3': 'elevation'}, inplace=True)
        data.rename(columns={'geometry.x': 'x', 'geometry.y': 'y'}, inplace=True)
    return data

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
