#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
# -*- coding: utf-8 -*-
""" Provide U.S. marriage and divorce statistics between 1867 and 2011

Data from the CDC's National Center for Health Statistics (NHCS) database (http://www.cdc.gov/nchs/)

Data organized by Randal S. Olson (http://www.randalolson.com)

Data Structure
--------------

The entire data is available as a DataFrame on an attribute on the module - us_marriages_divorces.data

Datatype info:

>>> us_marriages_divorces.data.dtypes
Year                    int64
Marriages             float64
Divorces              float64
Population              int64
Marriages_per_1000    float64
Divorces_per_1000     float64
dtype: object

us_marriages_divorces.head output:

>>> us_marriages_divorces.data.head()
   Year  Marriages  Divorces  Population  Marriages_per_1000  Divorces_per_1000
0  1867   357000.0   10000.0    36970000                 9.7                0.3
1  1868   345000.0   10000.0    37885000                 9.1                0.3
2  1869   348000.0   11000.0    38870000                 9.0                0.3
3  1870   352000.0   11000.0    39905000                 8.8                0.3
4  1871   359000.0   12000.0    41010000                 8.8                0.3
"""


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
