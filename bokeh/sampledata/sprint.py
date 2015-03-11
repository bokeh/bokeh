from __future__ import absolute_import, print_function

from os.path import dirname, join

try:
    import pandas as pd
except ImportError as e:
    raise RuntimeError("sprint data requires pandas (http://pandas.pydata.org) to be installed")

sprint = pd.read_csv(join(dirname(__file__), 'sprint.csv'), skipinitialspace=True, escapechar="\\")
