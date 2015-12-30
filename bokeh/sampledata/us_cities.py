'''

'''
from __future__ import absolute_import

import json
from os.path import dirname, join, isfile, expanduser

path1 = join(dirname(__file__), 'us_cities.json')
path2 = expanduser('~/.bokeh/data/us_cities.json')
path = path1 if isfile(path1) else path2

if not isfile(path):
    raise RuntimeError('Use bokeh.sampledata.download to get the us_cities data.')
data = json.load(open(path))
