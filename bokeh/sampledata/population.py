#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import public, internal ; public, internal

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from ..util.deprecation import deprecated
from ..util.sampledata import external_csv

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'data',
)

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------


def load_population():
    '''

    '''
    deprecated((0, 12, 10), 'bokeh.sampledata.population.load_population()', 'bokeh.sampledata.population.data')
    return data

#-----------------------------------------------------------------------------
# Internal API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _read_data():
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
