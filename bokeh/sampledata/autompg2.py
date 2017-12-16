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

from bokeh.util.api import general, dev ; general, dev

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
    'autompg2',
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

def _capitalize_words(string):
    '''

    '''
    return " ".join([ word.capitalize() for word in string.split(" ") ])

def _read_data():
    '''

    '''
    df = package_csv('autompg2', 'auto-mpg2.csv').copy()
    df["manufacturer"] = df["manufacturer"].map(_capitalize_words)
    df["model"] = df["model"].map(_capitalize_words)
    df["drv"] = df["drv"].replace({"f": "front", "r": "rear", "4": "4x4"})
    return df

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

autompg2 = _read_data()
