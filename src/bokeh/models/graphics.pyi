#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Literal

# Bokeh imports
from ..core.has_props import abstract
from ..model import Model

@abstract
@dataclass(init=False)
class Marking(Model):
    ...

@dataclass
class Decoration(Model):

    marking: Marking = ...

    node: Literal["start", "middle", "end"] = ...
