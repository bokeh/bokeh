""" The data in airports.csv and routes.csv is a subset (limited to US airports)
of data available from OpenFlights.org. The complete data was collected on
September 07, 2017 and is available from:

.. code-block:: none

    https://openflights.org/data.html

"""
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'airports sample data requires Pandas (http://pandas.pydata.org) to be installed')

import os

from . import _data_dir

airports = pd.read_csv(os.path.join(_data_dir(), 'airports.csv'))
routes = pd.read_csv(os.path.join(_data_dir(), 'routes.csv'))
