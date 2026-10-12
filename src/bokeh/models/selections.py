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

# pyright: reportArgumentType=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.property.container import Dict, List, Seq
from ..core.property.enum import Enum
from ..core.property.instance import Instance, InstanceDefault
from ..core.property.numeric import NonNegative
from ..core.property.primitive import Bool, Int
from ..core.property.readonly import Readonly
from ..core.property.struct import Struct
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'GraphSelection',
    'GraphSelectionPolicy',
    'Selection',
    'SelectionPolicy',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Selection(Model):
    '''
    A Selection represents a portion of the data in a ``DataSource``, which
    can be visually manipulated in a plot.

    Selections are typically created by selecting points in a plot with
    a ``SelectTool``, but can also be programmatically specified.

    For most glyphs, the ``indices`` property is the relevant value to use.

    '''

    indices = Seq(Int, default=[], help="""
    The "scatter" level indices included in a selection. For example, for a
    selection on a ``Circle`` glyph, this list records the indices of which
    individual circles are selected.

    For "multi" glyphs such as ``Patches``, ``MultiLine``, and ``Polygons``,
    etc, this list records the indices of which entire sub-items are selected.
    For example, which feature records of a ``Polygons`` glyph are selected.
    """)

    line_indices = Seq(Int, default=[], help="""
    The point indices included in a selection on a ``Line`` glyph.

    This value records the indices of the individual points on a ``Line`` that
    were selected by a selection tool.
    """)

    multiline_indices = Dict(Int, Seq(Int), default={}, help="""
    The detailed point indices included in a selection on a ``MultiLine``.

    This value records which points, on which lines, are part of a selection
    on a ``MultiLine``. The keys are the top level indices (i.e. which line)
    which map to lists of indices (i.e. which points on that line).

    If you only need to know which lines are selected, without knowing what
    individual points on those lines are selected, then you can look at the
    keys of this dictionary (converted to ints).
    """)

    image_indices = List(Struct(index=Int, i=Int, j=Int, flat_index=Int), help="""

    """)

class GraphSelection(Model):
    ''' The directly selected node and edge records of a graph.

    Graph selection policies expand these direct selections into the normal
    ``selected`` state of the graph's node and edge sources.
    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    nodes = Readonly(Instance(Selection), default=InstanceDefault(Selection), help="""
    Directly selected node records, before graph-policy expansion.
    """)

    edges = Readonly(Instance(Selection), default=InstanceDefault(Selection), help="""
    Directly selected edge records, before graph-policy expansion.
    """)

class SelectionPolicy(Model):
    ''' Control how hits from renderers sharing a data source are combined.

    ``combine="union"`` selects a record hit by any renderer. With
    ``combine="intersection"``, a record must be hit by every renderer.
    '''

    combine = Enum("union", "intersection", default="union", help="""
    How to combine hit-test results from renderers sharing a data source.
    """)

class GraphSelectionPolicy(SelectionPolicy):
    ''' Control how direct graph hits propagate through graph topology.

    A :class:`~bokeh.models.renderers.GraphRenderer` independently chooses
    whether nodes or edges receive direct hit tests. This policy then expands
    those hits. For example, ``node_hops=2`` includes nodes reachable within
    two hops, while ``node_hops_mode="exact"`` limits the expansion to the
    two-hop frontier (plus directly selected nodes when ``include_direct`` is
    true).

    ``include_incident_edges`` expands node selections to their incident
    edges. ``include_end_nodes`` expands edge selections to their endpoint
    nodes. These options can be combined.
    '''

    node_hops = NonNegative(Int, default=0, help="""
    Number of graph hops to traverse from directly selected nodes.
    """)

    node_hops_mode = Enum("exact", "up_to", default="up_to", help="""
    Whether to include only nodes at exactly ``node_hops`` or every node up to
    that distance.
    """)

    node_direction = Enum("both", "out", "in", default="both", help="""
    Direction used when traversing graph edges from selected nodes.
    """)

    include_direct = Bool(default=True, help="""
    Whether directly hit nodes or edges remain in the expanded selection.
    """)

    include_incident_edges = Bool(default=False, help="""
    Whether selecting nodes also selects edges incident to the expanded nodes.
    """)

    include_end_nodes = Bool(default=False, help="""
    Whether selecting edges also selects their endpoint nodes.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
