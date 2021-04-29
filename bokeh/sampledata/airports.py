#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' US airports with field elevations > 1500 meters.

Sourced from http://services.nationalmap.gov on October 15, 2015.

This module contains one pandas Dataframe: ``data``.

.. rubric:: ``data``

:bokeh-dataframe:`bokeh.sampledata.airports.data`

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

# Bokeh imports
from ..util.dependencies import import_required
from ..util.sampledata import external_path

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

def _read_data():
    '''

    '''
    pd = import_required('pandas', 'airports sample data requires Pandas (http://pandas.pydata.org) to be installed')
    with open(external_path('airports.json'), 'r') as f:
        content = f.read()
        airports = json.loads(content)
        schema = [['attributes', 'nam'], ['attributes', 'zv3'], ['geometry', 'x'], ['geometry', 'y']]
        data = pd.json_normalize(airports['features'], meta=schema)
        data.rename(columns={'attributes.nam': 'name', 'attributes.zv3': 'elevation'}, inplace=True)
        data.rename(columns={'geometry.x': 'x', 'geometry.y': 'y'}, inplace=True)
    return data

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
