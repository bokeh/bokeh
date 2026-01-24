#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ...core.enums import RenderLevelType as RenderLevel
from ...model.model import Model, _ModelInit
from ..coordinates import CoordinateMapping
from ..dom import DOMNode
from ..ui.menus import Menu
from ..ui.ui_element import StyledElement, UIElement, _StyledElementInit

class _RendererGroupInit(_ModelInit, total=False):
    visible: bool

class RendererGroup(Model):
    def __init__(self, **kwargs: Unpack[_RendererGroupInit]) -> None: ...

    visible: bool = ...

class _RendererInit(_StyledElementInit, total=False):
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
    def __init__(self, **kwargs: Unpack[_RendererInit]) -> None: ...

    level: RenderLevel = ...
    visible: bool = ...
    coordinates: CoordinateMapping | None = ...
    x_range_name: str = ...
    y_range_name: str = ...
    group: RendererGroup | None = ...
    propagate_hover: bool = ...
    context_menu: Menu | None = ...

class _CompositeRendererInit(_RendererInit, total=False):
    renderers: list[Renderer]
    elements: list[UIElement | DOMNode]

class CompositeRenderer(Renderer):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_CompositeRendererInit]) -> None: ...

    renderers: list[Renderer] = ...
    elements: list[UIElement | DOMNode] = ...

class _DataRendererInit(_RendererInit, total=False):
    ...

class DataRenderer(Renderer):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DataRendererInit]) -> None: ...

class _GuideRendererInit(_RendererInit, total=False):
    ...

class GuideRenderer(Renderer):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_GuideRendererInit]) -> None: ...
