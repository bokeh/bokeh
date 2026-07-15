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
from ...model.model import Model, _ModelInit

class _GroupByInit(_ModelInit, total=False):
    ...

class GroupBy(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_GroupByInit]) -> None: ...

class _GroupByModelsInit(_GroupByInit, total=False):
    groups: list[list[Model]]

class GroupByModels(GroupBy):
    def __init__(self, **kwargs: Unpack[_GroupByModelsInit]) -> None: ...

    groups: list[list[Model]] = ...

class _GroupByNameInit(_GroupByInit, total=False):
    ...

class GroupByName(GroupBy):
    def __init__(self, **kwargs: Unpack[_GroupByNameInit]) -> None: ...
