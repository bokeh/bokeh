#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ...core.enums import RenderLevelType as RenderLevel
from ...core.has_props import abstract
from ...model import Model
from ..coordinates import CoordinateMapping
from ..dom import DOMNode
from ..ui import Menu, StyledElement, UIElement

@dataclass
class RendererGroup(Model):

    visible: bool = ...

@abstract
@dataclass(init=False)
class Renderer(StyledElement):

    level: RenderLevel = ...

    visible: bool = ...

    coordinates: CoordinateMapping | None = ...

    x_range_name: str = ...

    y_range_name: str = ...

    group: RendererGroup | None = ...

    propagate_hover: bool = ...

    context_menu: Menu | None = ...

@abstract
@dataclass(init=False)
class CompositeRenderer(Renderer):

    renderers: list[Renderer] = ...

    elements: list[UIElement | DOMNode] = ...

@abstract
@dataclass(init=False)
class DataRenderer(Renderer):
    ...

@abstract
@dataclass(init=False)
class GuideRenderer(Renderer):
    ...
