#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' This modules exposes geometry data for Unites States.

This module contains one dict: ``data``.

The data is indexed by two-tuples of `` (state_id, county_id)`` that
have the following dictionaries as values:

.. code-block:: ipython

    In [25]: data[(1,1)]
    Out[25]:
    {
        'name': 'Autauga',
        'detailed name': 'Autauga County, Alabama',
        'state': 'al',
        'lats': [32.4757, ..., 32.48112],
        'lons': [-86.41182, ..., -86.41187]
    }

Entries for ``'name'`` can have duplicates for certain states (e.g. Virginia).
The combination of ``'detailed name'`` and ``'state'`` will always be unique.

'''
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import csv
import xml.etree.ElementTree as et
from typing import (
    Dict,
    List,
    Tuple,
    TypedDict,
)

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

class CountyData(TypedDict):
    name: str
    detailed_name: str
    state: str
    lats: List[float]
    lons: List[float]

def _read_data() -> Dict[Tuple[int, int], CountyData]:
    '''

    '''
    nan = float('NaN')

    data = {}

    with open_csv(external_path('US_Counties.csv')) as f:
        next(f)
        reader = csv.reader(f, delimiter=",", quotechar='"')
        for row in reader:
            name, _, state, _, geometry, _, _, _, det_name, state_id, county_id, _, _ = row
            xml = et.fromstring(geometry)
            lats: List[float] = []
            lons: List[float] = []
            for i, poly in enumerate(xml.findall('.//outerBoundaryIs/LinearRing/coordinates')):
                if i > 0:
                    lats.append(nan)
                    lons.append(nan)
                coords = (c.split(',')[:2] for c in poly.text.split())
                lat, lon = list(zip(*[(float(lat), float(lon)) for lon, lat in coords]))
                lats.extend(lat)
                lons.extend(lon)
            data[(int(state_id), int(county_id))] = dict(
                name = name,
                detailed_name = det_name,
                state = state,
                lats = lats,
                lons = lons
            )

    return data

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
