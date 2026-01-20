#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Unpack

# Bokeh imports
from ..model.model import Model, ModelInit

class ComparisonInit(ModelInit, total=False):
    ...

class Comparison(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ComparisonInit]) -> None: ...

class CustomJSCompareInit(ComparisonInit, total=False):
    args: dict[str, Any]
    code: str

class CustomJSCompare(Comparison):
    def __init__(self, **kwargs: Unpack[CustomJSCompareInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...

class NanCompareInit(ComparisonInit, total=False):
    ascending_first: bool

class NanCompare(Comparison):
    def __init__(self, **kwargs: Unpack[NanCompareInit]) -> None: ...

    ascending_first: bool = ...
