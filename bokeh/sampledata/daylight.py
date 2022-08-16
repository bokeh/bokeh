#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide 2013 Warsaw daylight hours.

License: free to use and redistribute (see `this FAQ`_ for details).

Sourced from http://www.sunrisesunset.com

This module contains one pandas Dataframe: ``daylight_warsaw_2013``.

.. rubric:: ``daylight_warsaw_2013``

:bokeh-dataframe:`bokeh.sampledata.daylight.daylight_warsaw_2013`

.. bokeh-sampledata-xref:: daylight

.. _this FAQ: https://www.sunrisesunset.com/faqs.asp#other_usage
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
from ..util.sampledata import package_csv

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'daylight_warsaw_2013',
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
    df = package_csv('daylight', 'daylight_warsaw_2013.csv', parse_dates=["Date", "Sunrise", "Sunset"])

    df["Date"] = df.Date.map(lambda x: x.date())
    df["Sunrise"] = df.Sunrise.map(lambda x: x.time())
    df["Sunset"] = df.Sunset.map(lambda x: x.time())

    return df

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

daylight_warsaw_2013 = _read_data()
