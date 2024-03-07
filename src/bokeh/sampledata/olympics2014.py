#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide medal counts by country for the 2014 Olympics.

Sourced from public news sources in 2014.

This module contains a single dict: ``data``.

The dictionary has a key ``"data"`` that lists sub-dictionaries, one for each
country:

.. code-block:: python

    {
        'abbr': 'DEU',
        'medals': {'total': 15, 'bronze': 4, 'gold': 8, 'silver': 3},
        'name': 'Germany'
    }

.. bokeh-sampledata-xref:: olympics2014
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
from ..util.sampledata import load_json, package_path

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

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = load_json(package_path('olympics2014.json'))
