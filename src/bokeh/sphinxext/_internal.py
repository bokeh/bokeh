# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

import pathlib
import os

__all__ = (
    "_REPO_TOP",
)

# TODO (bv) this needs to be a configuration
# issue #14499; moved from bokeh.sphinxext.util
_REPO_TOP = pathlib.PurePath(os.getcwd()).parents[1]
