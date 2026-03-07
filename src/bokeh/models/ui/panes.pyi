#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Unpack

# Bokeh imports
from ..dom import DOMNode
from .ui_element import UIElement, _UIElementInit

class _PaneInit(_UIElementInit, total=False):
    elements: list[UIElement | DOMNode]

class Pane(UIElement):
    def __init__(self, **kwargs: Unpack[_PaneInit]) -> None: ...

    elements: list[UIElement | DOMNode] = ...
