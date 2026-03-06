#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ...core.enums import LocationType as Location
from ...core.property_aliases import CSSLength
from .panes import Pane

@dataclass
class Drawer(Pane):

    location: Location = ...

    open: bool = ...

    size: float | CSSLength = ...

    resizable: bool = ...
