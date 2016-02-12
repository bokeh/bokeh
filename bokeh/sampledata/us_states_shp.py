from __future__ import absolute_import

from os.path import dirname, join, isfile, expanduser

path1 = join(dirname(__file__), 'us_states.shp')
path2 = expanduser('~/.bokeh/data/us_states.shp')
shp_path = path1 if isfile(path1) else path2

if not isfile(shp_path):
    raise RuntimeError('Use bokeh.sampledata.download to get the US State shapefile data.')
