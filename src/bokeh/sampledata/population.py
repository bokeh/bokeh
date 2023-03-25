#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Historical and projected population data by age, gender, and country.

License: `CC BY 3.0 IGO`_

Sourced from: https://population.un.org/wpp/Download/Standard/Population/

This module contains one pandas Dataframe: ``data``.

.. rubric:: ``data``

:bokeh-dataframe:`bokeh.sampledata.population.data`

.. bokeh-sampledata-xref:: population
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
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pandas import DataFrame

# Bokeh imports
from ..util.sampledata import external_csv

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

def _read_data() -> DataFrame:
    '''

    '''
    df = external_csv('population', 'WPP2012_SA_DB03_POPULATION_QUINQUENNIAL.csv', encoding="CP1250")
    df = df[df.Sex != "Both"]
    df = df.drop(["VarID", "Variant", "MidPeriod", "SexID", "AgeGrpSpan"], axis=1)
    df = df.rename(columns={"Time": "Year"})
    df.Value *= 1000
    return df

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
