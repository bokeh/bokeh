''' Provide U.S. marriage and divorce statistics between 1867 and 2014

Data from the CDC's National Center for Health Statistics (NHCS) database
(http://www.cdc.gov/nchs/).

Data organized by Randal S. Olson (http://www.randalolson.com)

'''
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'us_marriages_divorces sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import dirname, join

data = pd.read_csv(
    join(dirname(__file__), 'us_marriages_divorces.csv'))

# Fill in missing data with a simple linear interpolation
data = data.interpolate(method='linear', axis=0).ffill().bfill()
