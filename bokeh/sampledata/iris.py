'''
This module provides Fisher's Iris flower data set. It exposes a an attribute 'flowers' which is
a pandas dataframe with the following fields:

    flowers['petal_length']
    flowers['petal_width']
    flowers['sepal_length']
    flowers['sepal_width']
    flowers['species']

'''
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'iris sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import dirname, join

flowers = pd.read_csv(join(dirname(__file__), 'iris.csv'))
