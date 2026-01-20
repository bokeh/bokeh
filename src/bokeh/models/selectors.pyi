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
from ..model.model import Model, ModelInit

class SelectorInit(ModelInit, total=False):
    query: str

class Selector(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[SelectorInit]) -> None: ...

    query: str = ...

class ByIDInit(SelectorInit, total=False):
    ...

class ByID(Selector):
    def __init__(self, **kwargs: Unpack[ByIDInit]) -> None: ...

class ByClassInit(SelectorInit, total=False):
    ...

class ByClass(Selector):
    def __init__(self, **kwargs: Unpack[ByClassInit]) -> None: ...

class ByCSSInit(SelectorInit, total=False):
    ...

class ByCSS(Selector):
    def __init__(self, **kwargs: Unpack[ByCSSInit]) -> None: ...

class ByXPathInit(SelectorInit, total=False):
    ...

class ByXPath(Selector):
    def __init__(self, **kwargs: Unpack[ByXPathInit]) -> None: ...
