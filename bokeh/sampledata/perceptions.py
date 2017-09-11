'''
This module provides provides access to probly.csv and numberly.csv

'''
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'perceptioms sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import dirname, join

probly = pd.read_csv(join(dirname(__file__), 'probly.csv'))
numberly = pd.read_csv(join(dirname(__file__), 'numberly.csv'))
