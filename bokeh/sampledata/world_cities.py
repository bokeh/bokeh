''' The data in world_cities.csv was taken from GeoNames ``cities5000.zip``
downloaded from

.. code-block:: none

    http://www.geonames.org/export/

on Tuesday September 15, 2015.

Under ``CC-BY`` license (creative commons attributions license).

'''
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'world_cities sample data requires Pandas (http://pandas.pydata.org) to be installed')

from . import _data_dir

try:
    data = pd.read_csv(_data_dir("world_cities.csv"))
except (IOError, OSError):
    raise RuntimeError('Could not load file "world_cities.csv". Please execute bokeh.sampledata.download()')
