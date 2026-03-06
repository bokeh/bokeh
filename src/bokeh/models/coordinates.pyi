#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..model.model import JSEventCallback, Model, _ModelInit
from .ranges import Range
from .scales import Scale

# class _CoordinateMappingInit(_ModelInit, total=False):
#     x_source: Range
#     y_source: Range
#     x_scale: Scale
#     y_scale: Scale
#     x_target: Range
#     y_target: Range

class _CoordinateMappingInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    x_source: Range
    y_source: Range
    x_scale: Scale
    y_scale: Scale
    x_target: Range
    y_target: Range

class CoordinateMapping(Model):
    def __init__(self, **kwargs: Unpack[_CoordinateMappingInit]) -> None: ...

    x_source: Range = ...
    y_source: Range = ...
    x_scale: Scale = ...
    y_scale: Scale = ...
    x_target: Range = ...
    y_target: Range = ...
