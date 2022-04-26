#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Airport routes data from OpenFlights.org.

License: `ODbL 1.0`_

Sourced from https://openflights.org/data.html on September 07, 2017.

This module contains two pandas Dataframes: ``airports`` and ``routes``.

.. rubric:: ``airports``

:bokeh-dataframe:`bokeh.sampledata.airport_routes.airports`

.. rubric:: ``routes``

:bokeh-dataframe:`bokeh.sampledata.airport_routes.routes`

.. bokeh-sampledata-xref:: airport_routes
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

# Bokeh imports
from ..util.sampledata import external_csv

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'airports',
    'routes',
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

airports = external_csv('airport_routes', 'airports.csv')
routes   = external_csv('airport_routes', 'routes.csv')
