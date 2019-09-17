#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Column',
    'ColumnDataSource',
    'curdoc',
    'DEFAULT_TOOLS',
    'Document',
    'figure',
    'Figure',
    'gmap',
    'GMap',
    'gridplot',
    'GridSpec',
    'markers',
    'output_file',
    'output_notebook',
    'reset_output',
    'Row',
    'save',
    'show',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

# this is just for testing, otherwise the figure module is shadowed
# by the figure function and inacessible
from . import figure as _figure

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

from .figure import Figure; Figure
from .figure import figure; figure
from .figure import markers; markers
from .figure import DEFAULT_TOOLS; DEFAULT_TOOLS

from .gmap import GMap; GMap
from .gmap import gmap; gmap

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
from ..layouts import gridplot, GridSpec; gridplot, GridSpec

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
