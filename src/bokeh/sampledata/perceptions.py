#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provides access to ``probly.csv`` and ``numberly.csv``.

License: `MIT license`_

Sourced from: https://github.com/zonination/perceptions

This module contains two pandas Dataframes: ``probly`` and ``numberly``.

.. rubric:: ``probly``

:bokeh-dataframe:`bokeh.sampledata.perceptions.probly`

.. rubric:: ``numberly``

:bokeh-dataframe:`bokeh.sampledata.perceptions.numberly`

.. bokeh-sampledata-xref:: perceptions
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
    'numberly',
    'probly',
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

numberly = package_csv('perceptions', 'numberly.csv')
probly   = package_csv('perceptions', 'probly.csv')
