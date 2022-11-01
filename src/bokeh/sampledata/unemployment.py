#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Per-county unemployment data for Unites States in 2009.

License: `Public Domain`_

Sourced from: https://www.bls.gov

This module contains one dict: ``data``.

The dict is indexed by the two-tuples containing ``(state_id, county_id)`` and
has the unemployment rate (2009) as the value.

.. code-block:: ipython

    {
        (1, 1): 9.7,
        (1, 3): 9.1,
        ...
    }

.. bokeh-sampledata-xref:: unemployment
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
from typing import TYPE_CHECKING

# Bokeh imports
from ..util.sampledata import external_path, open_csv

if TYPE_CHECKING:
    from typing_extensions import TypeAlias

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

State: TypeAlias = int
County: TypeAlias = int

def _read_data() -> dict[tuple[State, County], float]:
    '''

    '''
    data: dict[tuple[State, County], float] = {}
    with open_csv(external_path("unemployment09.csv")) as f:
        reader = csv.reader(f, delimiter=",", quotechar='"')
        for row in reader:
            _, state_id, county_id, _, _, _, _, _, rate = row
            data[(int(state_id), int(county_id))] = float(rate)
    return data

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
