#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..._types import Color, FontSize
from ...core.enums import ToolIconType as ToolIcon
from ...core.has_props import abstract
from .ui_element import UIElement

@abstract
@dataclass(init=False)
class Icon(UIElement):

    size: int | FontSize = ...

@dataclass
class BuiltinIcon(Icon):

    icon_name: ToolIcon | str = ...

    color: Color = ...

@dataclass
class SVGIcon(Icon):

    svg: str = ...

@dataclass
class TablerIcon(Icon):

    icon_name: str = ...
