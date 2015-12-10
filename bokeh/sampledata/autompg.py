"""

"""
from __future__ import absolute_import

from bokeh.util.dependencies import required
pd = required('pandas',
              'autompg sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import dirname, join

autompg = pd.read_csv(join(dirname(__file__), 'auto-mpg.csv'))
