# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# _figure is just for testing, otherwise the figure module is shadowed
# by the figure function and inacessible (needs happen up top)

# Bokeh imports
from . import figure as _figure

_figure

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "Column",
    "ColumnDataSource",
    "curdoc",
    "DEFAULT_TOOLS",
    "Document",
    "figure",
    "Figure",
    "from_networkx",
    "gmap",
    "GMap",
    "gridplot",
    "GridSpec",
    "markers",
    "output_file",
    "output_notebook",
    "reset_output",
    "Row",
    "save",
    "show",
)

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

from .figure import Figure  # noqa isort:skip
from .figure import figure  # noqa isort:skip
from .figure import markers  # noqa isort:skip
from .figure import DEFAULT_TOOLS  # noqa isort:skip

from .gmap import GMap  # noqa isort:skip
from .gmap import gmap  # noqa isort:skip

from .graph import from_networkx  # noqa isort:skip

# extra imports -- just things to add to 'from bokeh.plotting import'
from ..document import Document  # noqa isort:skip
from ..models import ColumnDataSource  # noqa isort:skip
from ..models.layouts import Row, Column  # noqa isort:skip
from ..io import curdoc  # noqa isort:skip
from ..io import output_file  # noqa isort:skip
from ..io import output_notebook  # noqa isort:skip
from ..io import reset_output  # noqa isort:skip
from ..io import save  # noqa isort:skip
from ..io import show  # noqa isort:skip
from ..layouts import gridplot, GridSpec  # noqa isort:skip

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
