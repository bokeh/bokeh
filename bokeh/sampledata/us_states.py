#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''
This modules exposes geometry data for Unites States. It exposes a dictionary 'data' which is
indexed by the two letter state code (e.g., 'CA', 'TX') and has the following dictionary as the
associated value:

    data['CA']['name']
    data['CA']['region']
    data['CA']['lats']
    data['CA']['lons']

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import csv
import codecs
import gzip
import xml.etree.cElementTree as et

# External imports

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

def _read_data():
    '''

    '''
    nan = float('NaN')

    data = {}

    with gzip.open(package_path('US_Regions_State_Boundaries.csv.gz')) as f:
        decoded = codecs.iterdecode(f, "utf-8")
        next(decoded)
        reader = csv.reader(decoded, delimiter=str(','), quotechar=str('"'))
        for row in reader:
            region, name, code, geometry, dummy = row
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
            data[code] = {
                'name'   : name,
                'region' : region,
                'lats'   : lats,
                'lons'   : lons,
            }

    return data

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
