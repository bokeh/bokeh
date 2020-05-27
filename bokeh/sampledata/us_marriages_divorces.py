#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide U.S. marriage and divorce statistics between 1867 and 2011

Data from the CDC's National Center for Health Statistics (NHCS) database
(http://www.cdc.gov/nchs/).

Data organized by Randal S. Olson (http://www.randalolson.com)

The entire data is available as a DataFrame on an attribute on the module - "us_marriages_divorces.data"

Structure of the data:

Year                   # list of int
Marriages              # list of float
Divorces               # list of float
Population             # list of int
Marriages_per_1000     # list of float
Divorces_per_1000      # list of float

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
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

def _read_data():
    '''

    '''

    data = package_csv('us_marriages_divorces', 'us_marriages_divorces.csv')
    return data.interpolate(method='linear', axis=0).ffill().bfill()

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
