''' Provide US Unemployment rate data by year, from 1948 to 20013

'''
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'unemployment1948 sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import dirname, join

data = pd.read_csv(join(dirname(__file__), 'unemployment1948.csv'))
