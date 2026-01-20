#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Sequence, TypedDict, Unpack

# Bokeh imports
from ..model.model import Model, ModelInit

class ImageIndex(TypedDict):
   index: int
   i: int
   j: int
   flat_index: int

class SelectionInit(ModelInit, total=False):
    indices: Sequence[int]
    line_indices: Sequence[int]
    multiline_indices: dict[int, Sequence[int]]
    image_indices: list[ImageIndex]

class Selection(Model):
    def __init__(self, **kwargs: Unpack[SelectionInit]) -> None: ...

    indices: Sequence[int] = ...
    line_indices: Sequence[int] = ...
    multiline_indices: dict[int, Sequence[int]] = ...
    image_indices: list[ImageIndex] = ...

class SelectionPolicyInit(ModelInit, total=False):
    ...

class SelectionPolicy(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[SelectionPolicyInit]) -> None: ...

class IntersectRenderersInit(SelectionPolicyInit, total=False):
    ...

class IntersectRenderers(SelectionPolicy):
    def __init__(self, **kwargs: Unpack[IntersectRenderersInit]) -> None: ...

class UnionRenderersInit(SelectionPolicyInit, total=False):
    ...

class UnionRenderers(SelectionPolicy):
    def __init__(self, **kwargs: Unpack[UnionRenderersInit]) -> None: ...
