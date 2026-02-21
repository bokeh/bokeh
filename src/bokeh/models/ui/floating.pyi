#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ...core.enums import LocationType as Location
from ...core.property_aliases import CSSLength
from .panes import Pane, _PaneInit

class _DrawerInit(_PaneInit, total=False):
    location: Location
    open: bool
    size: float | CSSLength
    resizable: bool

class Drawer(Pane):
    def __init__(self, **kwargs: Unpack[_DrawerInit]) -> None: ...

    location: Location = ...
    open: bool = ...
    size: float | CSSLength = ...
    resizable: bool = ...
