#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' The data in airports.json is a subset of US airports with field
elevations > 1500 meters. The query result was taken from

.. code-block:: none

    http://services.nationalmap.gov/arcgis/rest/services/GlobalMap/GlobalMapWFS/MapServer/10/query

on October 15, 2015.

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
import json

# External imports

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
        data = pd.io.json.json_normalize(airports['features'], meta=schema)
        data.rename(columns={'attributes.nam': 'name', 'attributes.zv3': 'elevation'}, inplace=True)
        data.rename(columns={'geometry.x': 'x', 'geometry.y': 'y'}, inplace=True)
    return data

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
