#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# this is just for testing, otherwise the figure module is shadowed
# by the figure function and inacessible (needs happen up top)
from . import figure as _figure ; _figure

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'column',
    'ColumnDataSource',
    'curdoc',
    'DEFAULT_TOOLS',
    'Document',
    'figure',
    'Figure',
    'from_networkx',
    'gmap',
    'GMap',
    'gridplot',
    'markers',
    'output_file',
    'output_notebook',
    'reset_output',
    'row',
    'save',
    'show',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

from .figure import Figure; Figure
from .figure import figure; figure
from .figure import markers; markers
from .figure import DEFAULT_TOOLS; DEFAULT_TOOLS

from .gmap import GMap; GMap
from .gmap import gmap; gmap

from .graph import from_networkx; from_networkx

# extra imports -- just things to add to 'from bokeh.plotting import'
from ..document import Document; Document

from ..models import ColumnDataSource; ColumnDataSource
from ..models.layouts import Row, Column; Row, Column

from ..io import curdoc; curdoc
from ..io import output_file; output_file
from ..io import output_notebook; output_notebook
from ..io import reset_output; reset_output
from ..io import save; save
from ..io import show; show
from ..layouts import column, gridplot, row, GridSpec; column, gridplot, row, GridSpec

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
