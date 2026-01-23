#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Sequence, Unpack

# Bokeh imports
from ...core.enums import AutoType as Auto
from ...model.model import Model, _ModelInit
from ..css import Styles, StyleSheet
from ..nodes import Node
from .menus import Menu

class _StyledElementInit(_ModelInit, total=False):
    html_attributes: dict[str, str]
    html_id: str | None
    css_classes: Sequence[str]
    css_variables: dict[str, str | Node]
    styles: dict[str, str | None] | Styles
    stylesheets: list[StyleSheet | str | dict[str, dict[str, str | None] | Styles]]

class StyledElement(Model):
    def __init__(self, **kwargs: Unpack[_StyledElementInit]) -> None: ...

    html_attributes: dict[str, str] = ...
    html_id: str | None = ...

    @property
    def css_classes(self) -> list[str]: ...
    @css_classes.setter
    def css_classes(self, css_classes: Sequence[str]) -> None: ...

    css_variables: dict[str, str | Node] = ...
    styles: dict[str, str | None] | Styles = ...
    stylesheets: list[StyleSheet | str | dict[str, dict[str, str | None] | Styles]] = ...

class _UIElementInit(_StyledElementInit, total=False):
    visible: bool
    context_menu: Menu | Auto | None

class UIElement(StyledElement):
    def __init__(self, **kwargs: Unpack[_UIElementInit]) -> None: ...

    visible: bool = ...
    context_menu: Menu | Auto | None = ...
