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
from ..layouts import LayoutDOM, _LayoutDOMInit

class _WidgetInit(_LayoutDOMInit, total=False):
    ...

class Widget(LayoutDOM):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_WidgetInit]) -> None: ...
