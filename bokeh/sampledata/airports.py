""" The data in airports.json is a subset of US airports with field
elevations > 1500 meters. The query result was taken from

.. code-block:: none

    http://services.nationalmap.gov/arcgis/rest/services/GlobalMap/GlobalMapWFS/MapServer/10/query

on October 15, 2015.
"""
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'airports sample data requires Pandas (http://pandas.pydata.org) to be installed')

import json
import os

from . import _data_dir

with open(os.path.join(_data_dir(), 'airports.json'), 'r') as data_file:
    content = data_file.read()
    airports = json.loads(content)
    schema = [['attributes', 'nam'], ['attributes', 'zv3'], ['geometry', 'x'], ['geometry', 'y']]
    data = pd.io.json.json_normalize(airports['features'], meta=schema)
    data.rename(columns={'attributes.nam': 'name', 'attributes.zv3': 'elevation'}, inplace=True)
    data.rename(columns={'geometry.x': 'x', 'geometry.y': 'y'}, inplace=True)
