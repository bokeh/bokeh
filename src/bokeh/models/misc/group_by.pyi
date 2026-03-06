#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ...core.has_props import abstract
from ...model import Model

@abstract
@dataclass(init=False)
class GroupBy(Model):
    ...

@dataclass
class GroupByModels(GroupBy):

    groups: list[list[Model]] = ...

@dataclass
class GroupByName(GroupBy):
    ...
