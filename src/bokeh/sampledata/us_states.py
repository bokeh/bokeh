#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Geometry data for US States.

This module contains one dict: ``data``.

The data is indexed by the two letter state code (e.g., 'CA', 'TX') and has the
following structure:

.. code-block:: python

    In [4]: data["OR"]
    Out[4]:
    {
        'name': 'Oregon',
        'region': 'Northwest',
        'lats': [46.29443, ..., 46.26068],
        'lons': [-124.03622, ..., -124.15935]
    }

.. bokeh-sampledata-xref:: us_states
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
import codecs
import csv
import gzip
import xml.etree.ElementTree as et
from typing import TypedDict

# External imports
from typing_extensions import TypeAlias

# Bokeh imports
from ..util.sampledata import package_path

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

State: TypeAlias = str

class StateData(TypedDict):
    name: str
    region: str
    lats: list[float]
    lons: list[float]

nan = float('NaN')

def _read_data() -> dict[State, StateData]:
    '''

    '''
    data: dict[State, StateData] = {}

    with gzip.open(package_path('US_Regions_State_Boundaries.csv.gz')) as f:
        decoded = codecs.iterdecode(f, "utf-8")
        next(decoded)
        reader = csv.reader(decoded, delimiter=",", quotechar='"')
        for row in reader:
            region, name, code, geometry, _ = row
            xml = et.fromstring(geometry)
            lats: list[float] = []
            lons: list[float] = []
            for i, poly in enumerate(xml.findall('.//outerBoundaryIs/LinearRing/coordinates')):
                if i > 0:
                    lats.append(nan)
                    lons.append(nan)
                assert isinstance(poly.text, str)
                coords = (c.split(',')[:2] for c in poly.text.split())
                lat, lon = list(zip(*[(float(lat), float(lon)) for lon, lat in coords]))
                lats.extend(lat)
                lons.extend(lon)
            data[code] = StateData(
                name   = name,
                region = region,
                lats   = lats,
                lons   = lons,
            )

    return data

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
