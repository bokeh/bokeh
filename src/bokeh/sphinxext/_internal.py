# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
import os
import pathlib

__all__ = (
    "REPO_TOP",
)

# issue #14499; moved from bokeh.sphinxext.util
REPO_TOP = pathlib.PurePath(os.getcwd()).parents[1]
