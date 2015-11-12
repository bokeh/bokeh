from __future__ import absolute_import

from . import _data_dir
try:
    import pandas as pd
except ImportError as e:
    raise RuntimeError("world cities requires pandas (http://pandas.pydata.org) to be installed")

try:
    data = pd.read_csv(_data_dir("world_cities.csv"))
except (IOError, OSError):
    raise RuntimeError('Could not load file "world_cities.csv". Please execute bokeh.sampledata.download()')

"""
The data in world_cities.csv was taken from the GeoNames cities5000.zip downloaded from http://www.geonames.org/export/
on Tuesday September 15, 2015. Under cc-by licence (creative commons attributions license).
"""
