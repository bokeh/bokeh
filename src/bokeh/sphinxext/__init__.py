# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
from typing import TypedDict

# -----------------------------------------------------------------------------
# Globals and constants
# ----------------------------------------------------------------------------

class SphinxParallelSpec(TypedDict):
    parallel_read_safe: bool
    parallel_write_safe: bool

PARALLEL_SAFE = SphinxParallelSpec(parallel_read_safe=True, parallel_write_safe=True)
