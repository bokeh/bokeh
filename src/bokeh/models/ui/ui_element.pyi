#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Sequence

# Bokeh imports
from ...core.enums import AutoType as Auto
from ...core.has_props import abstract
from ...model import Model
from ..css import Styles, StyleSheet
from ..nodes import Node
from .menus import Menu

@abstract
@dataclass(init=False)
class StyledElement(Model):

    html_attributes: dict[str, str] = ...

    html_id: str | None = ...

    css_classes: Sequence[str] = ...

    css_variables: dict[str, str | Node] = ...

    styles: dict[str, str | None] | Styles = ...

    stylesheets: list[StyleSheet | str | dict[str, dict[str, str | None] | Styles]] = ...

@abstract
@dataclass(init=False)
class UIElement(StyledElement):

    visible: bool = ...

    context_menu: Menu | Auto | None = ...
