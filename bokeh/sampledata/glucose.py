from __future__ import absolute_import

from os.path import join

try:
    import pandas as pd
except ImportError as e:
    raise RuntimeError("glucose data requires pandas (http://pandas.pydata.org) to be installed")

from . import _data_dir

data_dir = _data_dir()

data = pd.read_csv(
    join(data_dir, 'CGM.csv'),
    sep=',',
    parse_dates=[1],
    index_col=1
)
