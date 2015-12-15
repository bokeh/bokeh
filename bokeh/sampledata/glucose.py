from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'glucose sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import join

from . import _data_dir

data_dir = _data_dir()

data = pd.read_csv(
    join(data_dir, 'CGM.csv'),
    sep=',',
    parse_dates=[1],
    index_col=1
)
