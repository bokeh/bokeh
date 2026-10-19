#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import (
    Literal,
    Sequence,
    TypedDict,
    Unpack,
)

# Bokeh imports
from ..model.model import Model, _ModelInit

class ImageIndex(TypedDict):
   index: int
   i: int
   j: int
   flat_index: int

class _SelectionInit(_ModelInit, total=False):
    indices: Sequence[int]
    line_indices: Sequence[int]
    multiline_indices: dict[int, Sequence[int]]
    image_indices: list[ImageIndex]

class Selection(Model):
    def __init__(self, **kwargs: Unpack[_SelectionInit]) -> None: ...

    indices: Sequence[int] = ...
    line_indices: Sequence[int] = ...
    multiline_indices: dict[int, Sequence[int]] = ...
    image_indices: list[ImageIndex] = ...

class _GraphSelectionInit(_ModelInit, total=False):
    nodes: Selection
    edges: Selection

class GraphSelection(Model):
    def __init__(self, **kwargs: Unpack[_GraphSelectionInit]) -> None: ...

    nodes: Selection = ...
    edges: Selection = ...

class _SelectionPolicyInit(_ModelInit, total=False):
    combine: Literal["union", "intersection"]

class SelectionPolicy(Model):
    def __init__(self, **kwargs: Unpack[_SelectionPolicyInit]) -> None: ...

    combine: Literal["union", "intersection"] = ...

class _GraphSelectionPolicyInit(_SelectionPolicyInit, total=False):
    node_hops: int
    node_hops_mode: Literal["exact", "up_to"]
    node_direction: Literal["both", "out", "in"]
    include_direct: bool
    include_incident_edges: bool
    include_end_nodes: bool

class GraphSelectionPolicy(SelectionPolicy):
    def __init__(self, **kwargs: Unpack[_GraphSelectionPolicyInit]) -> None: ...

    node_hops: int = ...
    node_hops_mode: Literal["exact", "up_to"] = ...
    node_direction: Literal["both", "out", "in"] = ...
    include_direct: bool = ...
    include_incident_edges: bool = ...
    include_end_nodes: bool = ...
