#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' This modules exposes per-county unemployment data for Unites States in
2009. It exposes a dictionary ``data`` which is indexed by the two-tuple
containing ``(state_id, county_id)`` and has the unemployment rate (2009) as
the associated value.

'''
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import csv

# Bokeh imports
from ..util.sampledata import external_path, open_csv

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
    data = {}
    with open_csv(external_path('unemployment09.csv')) as f:
        reader = csv.reader(f, delimiter=str(','), quotechar=str('"'))
        for row in reader:
            dummy, state_id, county_id, dumm, dummy, dummy, dummy, dummy, rate = row
            data[(int(state_id), int(county_id))] = float(rate)
    return data

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = _read_data()
