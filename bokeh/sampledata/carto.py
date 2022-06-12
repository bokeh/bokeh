#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide GeoJSON data cartographic plots.

Sourced from public domain data:

* https://www.census.gov/geographies/mapping-files/time-series/geo/carto-boundary-file.html
* https://www.weather.gov/gis/USStates

This module contains the following :

``united_states``
    A GeoJSON structure with projected polygons for US territories,
    including Guam, Puerto Rico, Northern Marianas, American Samoa, and
    the Virgin Islands. Outlying states and territories are shifted to
    be closer together visually.

    Each polygon has the properties ``abbr``, ``fips``, and ``name`` for the
    territory abreviation, FIPS code, and name, respectively.

``united_states_path``
    Filesytem path to the raw geojson file for direct loading.

.. bokeh-sampledata-xref:: carto
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
import json

# Bokeh imports
from ..util.sampledata import external_path

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'united_states',
    'united_states_path',
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

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

united_states_path = external_path('carto_us.geojson')
united_states = json.load(open(united_states_path))
