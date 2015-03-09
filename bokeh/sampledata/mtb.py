from __future__ import absolute_import
from os.path import dirname, join

try:
    import pandas as pd
except ImportError as e:
    raise RuntimeError("mtb data requires pandas (http://pandas.pydata.org) to be installed")

obiszow_mtb_xcm = pd.read_csv(join(dirname(__file__), 'obiszow_mtb_xcm.csv'))
