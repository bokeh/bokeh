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
from ..._types import Color, FontSize
from ...core.enums import ToolIconType as ToolIcon
from .ui_element import UIElement, _UIElementInit

class _IconInit(_UIElementInit, total=False):
    size: int | FontSize

class Icon(UIElement):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_IconInit]) -> None: ...

    size: int | FontSize = ...

class _BuiltinIconInit(_IconInit, total=False):
    icon_name: ToolIcon | str
    color: Color

class BuiltinIcon(Icon):
    def __init__(self, **kwargs: Unpack[_BuiltinIconInit]) -> None: ...

    icon_name: ToolIcon | str = ...
    color: Color = ...

class _SVGIconInit(_IconInit, total=False):
    svg: str

class SVGIcon(Icon):
    def __init__(self, **kwargs: Unpack[_SVGIconInit]) -> None: ...

    svg: str = ...

class _TablerIconInit(_IconInit, total=False):
    icon_name: str

class TablerIcon(Icon):
    def __init__(self, **kwargs: Unpack[_TablerIconInit]) -> None: ...

    icon_name: str = ...
