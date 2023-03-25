#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' A version of the Auto MPG data set.

License: `CC0`_

Sourced from https://archive.ics.uci.edu/ml/datasets/auto+mpg

This module contains one pandas Dataframe: ``autompg``.

.. rubric:: ``autompg2``

:bokeh-dataframe:`bokeh.sampledata.autompg2.autompg2`

.. bokeh-sampledata-xref:: autompg2
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

def _capitalize_words(string: str) -> str:
    '''

    '''
    return " ".join(word.capitalize() for word in string.split(" "))

def _read_data() -> DataFrame:
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
