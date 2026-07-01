#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide Bokeh model "building block" classes.

One of the central design principals of Bokeh is that, regardless of
how the plot creation code is spelled in Python (or other languages),
the result is an object graph that encompasses all the visual and
data aspects of the scene. Furthermore, this *scene graph* is to be
serialized, and it is this serialized graph that the client library
BokehJS uses to render the plot. The low-level objects that comprise
a Bokeh scene graph are called :ref:`Models <bokeh.model>`.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportAttributeAccessIssue=false, reportUnsupportedDunderAll=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# Bokeh imports
from ..model import Model
from . import (
    annotations as _annotations,
    axes,
    callbacks,
    canvas,
    comparisons,
    coordinates,
    css,
    expressions,
    filters,
    formatters,
    glyphs,
    graphs,
    grids,
    labeling,
    layouts,
    map_plots,
    mappers,
    misc,
    nodes,
    plots,
    ranges,
    renderers,
    scales,
    selections,
    selectors,
    sources,
    text,
    textures,
    tickers,
    tiles,
    tools,
    transforms,
    ui,
    widgets,
)
from .annotations import *
from .axes import *
from .callbacks import *
from .canvas import *
from .comparisons import *
from .coordinates import *
from .css import *
from .expressions import *
from .filters import *
from .formatters import *
from .glyphs import *
from .graphs import *
from .grids import *
from .labeling import *
from .layouts import *
from .map_plots import *
from .mappers import *
from .misc import *
from .nodes import *
from .plots import *
from .ranges import *
from .renderers import *
from .scales import *
from .selections import *
from .selectors import *
from .sources import *
from .text import *
from .textures import *
from .tickers import *
from .tiles import *
from .tools import *
from .transforms import *
from .ui import *
from .widgets import *

# Restore the public submodule name without conflicting with __future__.annotations.
annotations = _annotations # type: ignore[assignment]

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# Keep dynamic submodule __all__ aggregation visible to type checkers.
def _all(module: Any) -> tuple[str, ...]:
    return module.__all__

__all__ = (
    "Model",
    *_all(_annotations),
    *_all(axes),
    *_all(callbacks),
    *_all(canvas),
    *_all(comparisons),
    *_all(coordinates),
    *_all(css),
    *_all(expressions),
    *_all(filters),
    *_all(formatters),
    *_all(glyphs),
    *_all(graphs),
    *_all(grids),
    *_all(labeling),
    *_all(layouts),
    *_all(map_plots),
    *_all(mappers),
    *_all(misc),
    *_all(nodes),
    *_all(plots),
    *_all(ranges),
    *_all(renderers),
    *_all(scales),
    *_all(selections),
    *_all(selectors),
    *_all(sources),
    *_all(text),
    *_all(textures),
    *_all(tickers),
    *_all(tiles),
    *_all(tools),
    *_all(transforms),
    *_all(ui),
    *_all(widgets),
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
