"""

"""
from __future__ import absolute_import

from bokeh.util.dependencies import import_required

pd = import_required('pandas', 'commits sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import dirname, join

data = pd.read_csv(join(dirname(__file__), 'commits.txt.gz'),
                   parse_dates=True, header=None, names=['day', 'datetime'], index_col='datetime')

data = data.tz_localize('GMT').tz_convert('US/Central')
data['time'] = data.index.time
