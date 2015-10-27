from __future__ import absolute_import
import os
import json

from . import _data_dir

try:
    from pandas.io.json import json_normalize
except ImportError as e:
    raise RuntimeError("airports requires pandas (http://pandas.pydata.org) to be installed")

with open(os.path.join(_data_dir(), 'airports.json'), 'r') as data_file:
    content = data_file.read()
    airports = json.loads(content)
    schema = [['attributes', 'nam'], ['attributes', 'zv3'], ['geometry', 'x'], ['geometry', 'y']]
    data = json_normalize(airports['features'], meta=schema)
    data.rename(columns={'attributes.nam': 'name', 'attributes.zv3': 'elevation'}, inplace=True)
    data.rename(columns={'geometry.x': 'x', 'geometry.y': 'y'}, inplace=True)

"""
The data in airports.json is a subset of US airports with field elevations > 1500 meter.
The query result was taken from http://services.nationalmap.gov/arcgis/rest/services/GlobalMap/GlobalMapWFS/MapServer/10/query on October 15, 2015.
"""
