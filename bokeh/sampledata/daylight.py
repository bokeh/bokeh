#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide 2013 Warsaw daylight hours from http://www.sunrisesunset.com

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

# External imports

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
