#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Sequence, TypedDict

# Bokeh imports
from ..core.has_props import abstract
from ..model import Model

class ImageIndex(TypedDict):
   index: int
   i: int
   j: int
   flat_index: int

@dataclass
class Selection(Model):

    indices: Sequence[int] = ...

    line_indices: Sequence[int] = ...

    multiline_indices: dict[int, Sequence[int]] = ...

    image_indices: list[ImageIndex] = ...

@abstract
@dataclass(init=False)
class SelectionPolicy(Model):
    ...

@dataclass
class IntersectRenderers(SelectionPolicy):
    ...

@dataclass
class UnionRenderers(SelectionPolicy):
    ...
