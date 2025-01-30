#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ...core.enums import (
    AnchorType as Anchor,
    AutoType as Auto,
    TooltipAttachmentType as TooltipAttachment,
)
from ..dom import DOMNode
from ..nodes import Coordinate
from ..selectors import Selector
from .ui_element import UIElement

@dataclass
class Tooltip(UIElement):

    position: Anchor | tuple[float, float] | Coordinate | None = ...

    target: UIElement | Selector | Auto = ...

    content: str | DOMNode | UIElement = ...

    attachment: TooltipAttachment | Auto = ...

    show_arrow: bool = ...

    closable: bool = ...

    interactive: bool = ...
