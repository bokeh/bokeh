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
from ..model.model import Model, _ModelInit

class _ComparisonInit(_ModelInit, total=False):
    ...

class Comparison(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ComparisonInit]) -> None: ...

class _CustomJSCompareInit(_ComparisonInit, total=False):
    args: dict[str, Any]
    code: str

class CustomJSCompare(Comparison):
    def __init__(self, **kwargs: Unpack[_CustomJSCompareInit]) -> None: ...

    args: dict[str, Any] = ...
    code: str = ...

class _NanCompareInit(_ComparisonInit, total=False):
    ascending_first: bool

class NanCompare(Comparison):
    def __init__(self, **kwargs: Unpack[_NanCompareInit]) -> None: ...

    ascending_first: bool = ...
