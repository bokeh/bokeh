from __future__ import absolute_import

from os.path import dirname, join, isfile, expanduser

path1 = join(dirname(__file__), 'movies.db')
path2 = expanduser('~/.bokeh/data/movies.db')
movie_path = path1 if isfile(path1) else path2

if not isfile(movie_path):
    raise RuntimeError('Use bokeh.sampledata.download to get the movies data.')
