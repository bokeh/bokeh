#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a table of data regarding bachelor's degrees earned by women.

The data is broken down by field for any given year.

Licence: `CC0`_

Sourced from: https://www.kaggle.com/datasets/sureshsrinivas/bachelorsdegreewomenusa

This module contains one pandas Dataframe: ``data``.

.. rubric:: ``data``

:bokeh-dataframe:`bokeh.sampledata.degrees.data`

.. bokeh-sampledata-xref:: degrees
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

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

data = package_csv('degrees', 'percent-bachelors-degrees-women-usa.csv')
