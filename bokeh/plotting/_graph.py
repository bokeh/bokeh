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

# Standard library imports
import sys

# Bokeh imports
from ..core.properties import field
from ..models import (
    Circle,
    ColumnarDataSource,
    ColumnDataSource,
    GlyphRenderer,
    MultiLine,
    Scatter,
)
from ._renderer import make_glyph, pop_visuals

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'get_graph_kwargs'
)

RENDERER_ARGS = ['name', 'level', 'visible', 'x_range_name', 'y_range_name',
                 'selection_policy', 'inspection_policy']

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def get_graph_kwargs(node_source, edge_source, **kwargs):

    if not isinstance(node_source, ColumnarDataSource):
        try:
            # try converting the source to ColumnDataSource
            node_source = ColumnDataSource(node_source)
        except ValueError as err:
            msg = "Failed to auto-convert {curr_type} to ColumnDataSource.\n Original error: {err}".format(
                curr_type=str(type(node_source)),
                err=err.message
            )
            raise ValueError(msg).with_traceback(sys.exc_info()[2])

    if not isinstance(edge_source, ColumnarDataSource):
        try:
            # try converting the source to ColumnDataSource
            edge_source = ColumnDataSource(edge_source)
        except ValueError as err:
            msg = "Failed to auto-convert {curr_type} to ColumnDataSource.\n Original error: {err}".format(
                curr_type=str(type(edge_source)),
                err=err.message
            )
            raise ValueError(msg).with_traceback(sys.exc_info()[2])

    marker = kwargs.pop('node_marker', None)
    marker_type = Scatter
    if isinstance(marker, dict) and 'field' in marker or marker in node_source.data:
        kwargs['node_marker'] = field(marker)
    else:
        if isinstance(marker, dict) and 'value' in marker:
            marker = marker['value']

        if marker is None or marker == "circle":
            marker_type = Circle
        else:
            kwargs["node_marker"] = marker

    ## node stuff
    node_visuals = pop_visuals(marker_type, kwargs, prefix="node_")

    if any(x.startswith('node_selection_') for x in kwargs):
        snode_visuals = pop_visuals(marker_type, kwargs, prefix="node_selection_", defaults=node_visuals)
    else:
        snode_visuals = None

    if any(x.startswith('node_hover_') for x in kwargs):
        hnode_visuals = pop_visuals(marker_type, kwargs, prefix="node_hover_", defaults=node_visuals)
    else:
        hnode_visuals = None

    if any(x.startswith('node_muted_') for x in kwargs):
        mnode_visuals = pop_visuals(marker_type, kwargs, prefix="node_muted_", defaults=node_visuals)
    else:
        mnode_visuals = None

    nsnode_visuals = pop_visuals(marker_type, kwargs, prefix="node_nonselection_", defaults=node_visuals)

    ## edge stuff
    edge_visuals = pop_visuals(MultiLine, kwargs, prefix="edge_")

    if any(x.startswith('edge_selection_') for x in kwargs):
        sedge_visuals = pop_visuals(MultiLine, kwargs, prefix="edge_selection_", defaults=edge_visuals)
    else:
        sedge_visuals = None

    if any(x.startswith('edge_hover_') for x in kwargs):
        hedge_visuals = pop_visuals(MultiLine, kwargs, prefix="edge_hover_", defaults=edge_visuals)
    else:
        hedge_visuals = None

    if any(x.startswith('edge_muted_') for x in kwargs):
        medge_visuals = pop_visuals(MultiLine, kwargs, prefix="edge_muted_", defaults=edge_visuals)
    else:
        medge_visuals = None

    nsedge_visuals = pop_visuals(MultiLine, kwargs, prefix="edge_nonselection_", defaults=edge_visuals)

    ## node stuff
    node_kwargs = {k.lstrip('node_'): v for k, v in kwargs.copy().items() if k.lstrip('node_') in marker_type.properties()}

    node_glyph = make_glyph(marker_type, node_kwargs, node_visuals)
    nsnode_glyph = make_glyph(marker_type, node_kwargs, nsnode_visuals)
    snode_glyph = make_glyph(marker_type, node_kwargs, snode_visuals)
    hnode_glyph = make_glyph(marker_type, node_kwargs, hnode_visuals)
    mnode_glyph = make_glyph(marker_type, node_kwargs, mnode_visuals)

    node_renderer = GlyphRenderer(
        data_source=node_source,
        glyph=node_glyph,
        selection_glyph=snode_glyph or "auto",
        nonselection_glyph=nsnode_glyph or "auto",
        hover_glyph=hnode_glyph,
        muted_glyph=mnode_glyph,
    )

    ## edge stuff
    edge_kwargs = {k.lstrip('edge_'): v for k, v in kwargs.copy().items() if k.lstrip('edge_') in MultiLine.properties()}

    edge_glyph = make_glyph(MultiLine, edge_kwargs, edge_visuals)
    nsedge_glyph = make_glyph(MultiLine, edge_kwargs, nsedge_visuals)
    sedge_glyph = make_glyph(MultiLine, edge_kwargs, sedge_visuals)
    hedge_glyph = make_glyph(MultiLine, edge_kwargs, hedge_visuals)
    medge_glyph = make_glyph(MultiLine, edge_kwargs, medge_visuals)

    edge_renderer = GlyphRenderer(
        data_source=edge_source,
        glyph=edge_glyph,
        selection_glyph=sedge_glyph or "auto",
        nonselection_glyph=nsedge_glyph or "auto",
        hover_glyph=hedge_glyph,
        muted_glyph=medge_glyph,
    )

    renderer_kwargs = {attr: kwargs.pop(attr) for attr in RENDERER_ARGS if attr in kwargs}

    renderer_kwargs["node_renderer"] = node_renderer
    renderer_kwargs["edge_renderer"] = edge_renderer

    return renderer_kwargs

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
