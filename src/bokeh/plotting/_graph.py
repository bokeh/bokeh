#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any

# Bokeh imports
from ..core.property.vectorization import Field, Value, field
from ..models.glyphs import Circle, MultiLine, Scatter
from ..models.renderers import GlyphRenderer
from ..models.sources import ColumnDataSource, GraphDataSource
from ._renderer import make_glyph, pop_visuals

if TYPE_CHECKING:
    from ..models.glyph import Glyph
    from ..models.sources import GraphEdges, GraphNodes
    from ._renderer import Attrs

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'get_graph_kwargs',
)

RENDERER_ARGS = ['name', 'level', 'visible', 'x_range_name', 'y_range_name',
                 'selection_policy', 'inspection_policy']

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def get_graph_kwargs(node_source: GraphNodes, edge_source: GraphEdges, **kwargs: Any) -> dict[str, Any]:
    # Preserve the original data and attribute names of canonical column inputs.
    if isinstance(node_source, Mapping) and "index" in node_source:
        node_source = ColumnDataSource(dict(node_source))
    if isinstance(edge_source, Mapping) and "start" in edge_source and "end" in edge_source:
        edge_source = ColumnDataSource(dict(edge_source))
    data_source = GraphDataSource(nodes=node_source, edges=edge_source)
    node_source = data_source.nodes
    edge_source = data_source.edges

    marker = kwargs.pop('node_marker', None)
    marker_type: type[Scatter | Circle] = Scatter
    if isinstance(marker, dict) and 'field' in marker:
        marker = Field(**marker)
    elif isinstance(marker, dict) and 'value' in marker:
        marker = Value(**marker)

    if isinstance(marker, Field):
        kwargs['node_marker'] = marker
    elif isinstance(marker, str) and isinstance(node_source, ColumnDataSource) and marker in node_source.data:
        kwargs['node_marker'] = field(marker)
    else:
        marker_value = marker.value if isinstance(marker, Value) else marker

        if marker_value is None or marker_value == "circle":
            if "node_radius" in kwargs:
                marker_type = Circle
            else:
                marker_type = Scatter
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

    mnode_visuals = pop_visuals(marker_type, kwargs, prefix="node_muted_", defaults=node_visuals, override_defaults={'alpha':0.2})

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

    medge_visuals = pop_visuals(MultiLine, kwargs, prefix="edge_muted_", defaults=edge_visuals, override_defaults={'alpha':0.2})

    nsedge_visuals = pop_visuals(MultiLine, kwargs, prefix="edge_nonselection_", defaults=edge_visuals)

    ## node stuff
    node_kwargs = _prefixed_kwargs(marker_type, kwargs, "node_")

    node_glyph = make_glyph(marker_type, node_kwargs, node_visuals)
    nsnode_glyph = make_glyph(marker_type, node_kwargs, nsnode_visuals)
    snode_glyph = make_glyph(marker_type, node_kwargs, snode_visuals)
    hnode_glyph = make_glyph(marker_type, node_kwargs, hnode_visuals)
    mnode_glyph = make_glyph(marker_type, node_kwargs, mnode_visuals)
    assert node_glyph is not None

    node_renderer = GlyphRenderer(
        data_source=node_source,
        glyph=node_glyph,
        selection_glyph=snode_glyph or "auto",
        nonselection_glyph=nsnode_glyph or "auto",
        hover_glyph=hnode_glyph,
        muted_glyph=mnode_glyph or "auto",
    )

    ## edge stuff
    edge_kwargs = _prefixed_kwargs(MultiLine, kwargs, "edge_")

    edge_glyph = make_glyph(MultiLine, edge_kwargs, edge_visuals)
    nsedge_glyph = make_glyph(MultiLine, edge_kwargs, nsedge_visuals)
    sedge_glyph = make_glyph(MultiLine, edge_kwargs, sedge_visuals)
    hedge_glyph = make_glyph(MultiLine, edge_kwargs, hedge_visuals)
    medge_glyph = make_glyph(MultiLine, edge_kwargs, medge_visuals)
    assert edge_glyph is not None

    edge_renderer = GlyphRenderer(
        data_source=edge_source,
        glyph=edge_glyph,
        selection_glyph=sedge_glyph or "auto",
        nonselection_glyph=nsedge_glyph or "auto",
        hover_glyph=hedge_glyph,
        muted_glyph=medge_glyph or "auto",
    )

    renderer_kwargs = {attr: kwargs.pop(attr) for attr in RENDERER_ARGS if attr in kwargs}

    renderer_kwargs["node_renderer"] = node_renderer
    renderer_kwargs["edge_renderer"] = edge_renderer
    renderer_kwargs["data_source"] = data_source

    return renderer_kwargs

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _prefixed_kwargs(glyphclass: type[Glyph], kwargs: Attrs, prefix: str) -> Attrs:
    ''' Collect ``prefix``-ed keyword arguments that name properties of
    ``glyphclass``, with the prefix removed. Other arguments are ignored.

    '''
    properties = glyphclass.properties()
    result: Attrs = {}
    for key, value in kwargs.items():
        if key.startswith(prefix) and (name := key.removeprefix(prefix)) in properties:
            result[name] = value
    return result

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
