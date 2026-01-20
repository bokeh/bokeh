#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Unpack

# Bokeh imports
from ...model.model import Model, ModelInit

class GroupByInit(ModelInit, total=False):
    ...

class GroupBy(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[GroupByInit]) -> None: ...

class GroupByModelsInit(GroupByInit, total=False):
    groups: list[list[Model]]

class GroupByModels(GroupBy):
    def __init__(self, **kwargs: Unpack[GroupByModelsInit]) -> None: ...

    groups: list[list[Model]] = ...

class GroupByNameInit(GroupByInit, total=False):
    ...

class GroupByName(GroupBy):
    def __init__(self, **kwargs: Unpack[GroupByNameInit]) -> None: ...
