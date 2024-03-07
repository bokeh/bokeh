#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' A small subset of data from the `Open Movie Database`_.

License: `CC BY-NC 4.0`_

Sourced from http://www.omdbapi.com

This modules has an attribute ``movie_path``. This attribute contains the path
to a SQLite database with the data.

.. bokeh-sampledata-xref:: movies_data

.. _Open Movie Database: http://www.omdbapi.com
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
from ..util.sampledata import external_path

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'movie_path',
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

movie_path = external_path('movies.db')
