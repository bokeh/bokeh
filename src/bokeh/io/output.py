#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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

# Bokeh imports
from .notebook import _activate_notebook, run_notebook_hook

if TYPE_CHECKING:
    from ..resources import Resources
    from .notebook import NotebookType

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'output_notebook',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def output_notebook(resources: Resources | str | None = None, verbose: bool = False,
        hide_banner: bool = False, load_timeout: int = 5000, notebook_type: NotebookType = "jupyter") -> None:
    ''' Configure |show| to generate output in notebook cells.

    Note that |show| may be called multiple
    times in a single cell to display multiple objects in the output cell. The
    objects will be displayed in order.

    Args:
        resources (Resources or str, optional) :
            How and where to load BokehJS from (default: CDN)

        verbose (bool, optional) :
            whether to display detailed BokehJS banner (default: False)

        hide_banner (bool, optional):
            whether to hide the Bokeh banner (default: False)

        load_timeout (int, optional) :
            Timeout in milliseconds when plots assume load timed out (default: 5000)

        notebook_type (string, optional):
            Notebook type (default: jupyter)

    Returns:
        None

    .. note::
        Generally, this should be called at the beginning of an interactive
        session or the top of a script.

    '''
    _activate_notebook(notebook_type)
    run_notebook_hook(notebook_type, "load", resources, verbose, hide_banner, load_timeout)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
