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
from ..model.model import Model, _ModelInit

class _SelectorInit(_ModelInit, total=False):
    query: str

class Selector(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_SelectorInit]) -> None: ...

    query: str = ...

class _ByIDInit(_SelectorInit, total=False):
    ...

class ByID(Selector):
    def __init__(self, **kwargs: Unpack[_ByIDInit]) -> None: ...

class _ByClassInit(_SelectorInit, total=False):
    ...

class ByClass(Selector):
    def __init__(self, **kwargs: Unpack[_ByClassInit]) -> None: ...

class _ByCSSInit(_SelectorInit, total=False):
    ...

class ByCSS(Selector):
    def __init__(self, **kwargs: Unpack[_ByCSSInit]) -> None: ...

class _ByXPathInit(_SelectorInit, total=False):
    ...

class ByXPath(Selector):
    def __init__(self, **kwargs: Unpack[_ByXPathInit]) -> None: ...
