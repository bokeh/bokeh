from __future__ import absolute_import

from os.path import dirname, join, isfile, expanduser

path1 = join(dirname(__file__), 'countries.kml')
path2 = expanduser('~/.bokeh/data/countries.kml')
countries_kml_path = path1 if isfile(path1) else path2

if not isfile(countries_kml_path):
        raise RuntimeError('Use bokeh.sampledata.download to get Countries KML data.')
