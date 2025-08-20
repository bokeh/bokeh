# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
import os
import pathlib
from typing import TypedDict

__all__ = (
    "PARALLEL_SAFE"
    "REPO_TOP",
)

class SphinxParallelSpec(TypedDict):
    parallel_read_safe: bool
    parallel_write_safe: bool

PARALLEL_SAFE = SphinxParallelSpec(parallel_read_safe=True, parallel_write_safe=True)

REPO_TOP = pathlib.PurePath(os.getcwd()).parents[1]
