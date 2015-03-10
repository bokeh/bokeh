'''
This module provides the US Unemployment rate data by year, from 1948 to 20013

'''
from __future__ import absolute_import

from os.path import dirname, join

try:
    import pandas as pd
except ImportError as e:
    raise RuntimeError("unemployment1948 data requires pandas (http://pandas.pydata.org) to be installed")

data = pd.read_csv(join(dirname(__file__), 'unemployment1948.csv'))
