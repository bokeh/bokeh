#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide 2013 Warsaw daylight hours.

Sourced from http://www.sunrisesunset.com

This module contains one pandas Dataframe: ``daylight_warsaw_2013``.

.. rubric:: ``daylight_warsaw_2013``

:bokeh-dataframe:`bokeh.sampledata.daylight.daylight_warsaw_2013`

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

def _read_data():
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
