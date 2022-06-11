#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide JSON data for co-occurrence of characters in Les Miserables.

Sourced from public domain data:

* https://www.census.gov/geographies/mapping-files/time-series/geo/carto-boundary-file.html
* https://www.weather.gov/gis/USStates

This module contains the following : ``us``.

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

united_states = json.load(open(external_path('carto_us.geojson')))
