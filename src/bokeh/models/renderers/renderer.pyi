#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Unpack

# Bokeh imports
from ...core.enums import RenderLevelType as RenderLevel
from ...model.model import Model, ModelInit
from ..coordinates import CoordinateMapping
from ..dom import DOMNode
from ..ui import (
    Menu,
    StyledElement,
    StyledElementInit,
    UIElement,
)

class RendererGroupInit(ModelInit, total=False):
    visible: bool

class RendererGroup(Model):
    def __init__(self, **kwargs: Unpack[RendererGroupInit]) -> None: ...

    visible: bool = ...

class RendererInit(StyledElementInit, total=False):
    level: RenderLevel
    visible: bool
    coordinates: CoordinateMapping | None
    x_range_name: str
    y_range_name: str
    group: RendererGroup | None
    propagate_hover: bool
    context_menu: Menu | None

class Renderer(StyledElement):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[RendererInit]) -> None: ...

    level: RenderLevel = ...
    visible: bool = ...
    coordinates: CoordinateMapping | None = ...
    x_range_name: str = ...
    y_range_name: str = ...
    group: RendererGroup | None = ...
    propagate_hover: bool = ...
    context_menu: Menu | None = ...

class CompositeRendererInit(RendererInit, total=False):
    renderers: list[Renderer]
    elements: list[UIElement | DOMNode]

class CompositeRenderer(Renderer):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[CompositeRendererInit]) -> None: ...

    renderers: list[Renderer] = ...
    elements: list[UIElement | DOMNode] = ...

class DataRendererInit(RendererInit, total=False):
    ...

class DataRenderer(Renderer):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[DataRendererInit]) -> None: ...

class GuideRendererInit(RendererInit, total=False):
    ...

class GuideRenderer(Renderer):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[GuideRendererInit]) -> None: ...
