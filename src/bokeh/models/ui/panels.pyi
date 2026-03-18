#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Unpack

# Bokeh imports
from ...core.enums import AutoType as Auto
from ...core.property_aliases import Anchor
from ..nodes import Coordinate, Node
from .panes import Pane, _PaneInit

class _PanelInit(_PaneInit, total=False):
    position: Coordinate
    anchor: Anchor
    width: Auto | int | Node
    height: Auto | int | Node

class Panel(Pane):
    def __init__(self, **kwargs: Unpack[_PanelInit]) -> None: ...

    position: Coordinate = ...
    anchor: Anchor = ...
    width: Auto | int | Node = ...
    height: Auto | int | Node = ...
