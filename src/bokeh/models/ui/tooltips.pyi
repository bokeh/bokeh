#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Unpack

# Bokeh imports
from ...core.enums import (
    AnchorType as Anchor,
    AutoType as Auto,
    TooltipAttachmentType as TooltipAttachment,
)
from ..dom import DOMNode
from ..nodes import Coordinate
from ..selectors import Selector
from .ui_element import UIElement, _UIElementInit

class _TooltipInit(_UIElementInit, total=False):
    position: Anchor | tuple[float, float] | Coordinate | None
    target: UIElement | Selector | Auto
    content: str | DOMNode | UIElement
    attachment: TooltipAttachment | Auto
    show_arrow: bool
    closable: bool
    interactive: bool

class Tooltip(UIElement):
    def __init__(self, **kwargs: Unpack[_TooltipInit]) -> None: ...

    position: Anchor | tuple[float, float] | Coordinate | None = ...
    target: UIElement | Selector | Auto = ...
    content: str | DOMNode | UIElement = ...
    attachment: TooltipAttachment | Auto = ...
    show_arrow: bool = ...
    closable: bool = ...
    interactive: bool = ...
