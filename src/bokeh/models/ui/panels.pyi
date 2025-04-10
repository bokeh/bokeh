#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ...core.enums import AutoType as Auto
from ...core.property_aliases import Anchor
from ..nodes import Coordinate, Node
from .panes import Pane

@dataclass
class Panel(Pane):

    position: Coordinate = ...

    anchor: Anchor = ...

    width: Auto | int | Node = ...

    height: Auto | int | Node = ...
