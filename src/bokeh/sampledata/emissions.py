#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' CO2 emmisions of selected countries in the years 2000 and 2010.

License: `Public Domain`_

This module contains one pandas Dataframe: ``data``.

.. rubric:: ``data``

:bokeh-dataframe:`bokeh.sampledata.emissions.data`

.. bokeh-sampledata-xref:: emissions
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

# Bokeh imports
from ..util.sampledata import package_csv

if TYPE_CHECKING:
    import pandas as pd

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

def _read_data() -> pd.DataFrame:
    df = pd.read_csv('_data/emissions.csv')

    countries = [
    "Trinidad and Tobago",
    "Qatar",
    "United Arab Emirates",
    "Oman",
    "Bahrain",
    "Singapore",
    "Netherlands Antilles",
    "Kazakhstan",
    "Equatorial Guinea",
    "Kuwait",
    ]

    df = df[df["country"].isin(countries)].reset_index(drop=True)
    years = (df["year"] == 2000.0) | (df["year"] == 2010.0)

    df = df[years].reset_index(drop=True)
    df["year"] = df.year.astype(int)
    df["year"] = df.year.astype(str)


    # create new columns for the different years
    a = df[df["year"] == "2000"]
    b = df[df["year"] == "2010"]
    data = a.merge(b, on="country")

    return data

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
