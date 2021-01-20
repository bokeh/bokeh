#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' This modules exposes geometry data for Unites States. It exposes a
dictionary ``data``, which is indexed by the two-tuples:

.. code-block:: python

    (state_id, county_id)

that have the following dictionaries as the associated value:

.. code-block:: python

    data[(1,1)]['name']
    data[(1,1)]['state']
    data[(1,1)]['detailed name']
    data[(1,1)]['lats']
    data[(1,1)]['lons']

Entries for ``'name'`` can have duplicates for certain states (e.g. Virginia).
The combination of ``'detailed name'`` and ``'state'`` will always be unique.

'''
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import csv
import xml.etree.ElementTree as et

# Bokeh imports
from ..util.sampledata import external_path, open_csv

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'data',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _read_data():
    '''

    '''
    nan = float('NaN')

    data = {}

    with open_csv(external_path('US_Counties.csv')) as f:
        next(f)
        reader = csv.reader(f, delimiter=",", quotechar='"')
        for row in reader:
            name, dummy, state, dummy, geometry, dummy, dummy, dummy, det_name, state_id, county_id, dummy, dummy = row
            xml = et.fromstring(geometry)
            lats = []
            lons = []
            for i, poly in enumerate(xml.findall('.//outerBoundaryIs/LinearRing/coordinates')):
                if i > 0:
                    lats.append(nan)
                    lons.append(nan)
                coords = (c.split(',')[:2] for c in poly.text.split())
                lat, lon = list(zip(*[(float(lat), float(lon)) for lon, lat in
                    coords]))
                lats.extend(lat)
                lons.extend(lon)
            data[(int(state_id), int(county_id))] = {
                'name' : name,
                'detailed name' : det_name,
                'state' : state,
                'lats' : lats,
                'lons' : lons,
            }

    return data

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
