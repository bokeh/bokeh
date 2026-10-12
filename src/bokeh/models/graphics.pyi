#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Literal, Unpack

# Bokeh imports
from .._specs import NumberSpec
from ..model.model import Model, _ModelInit

class _MarkingInit(_ModelInit, total=False):
    inherit_visuals: list[str]

class Marking(Model):
    inherit_visuals: list[str] = ...
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MarkingInit]) -> None: ...

class _DecorationInit(_ModelInit, total=False):
    marking: Marking
    node: Literal["start", "middle", "end"]
    inset: NumberSpec

class Decoration(Model):
    def __init__(self, **kwargs: Unpack[_DecorationInit]) -> None: ...

    marking: Marking = ...
    node: Literal["start", "middle", "end"] = ...
    inset: NumberSpec = ...
