#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Unpack

# Bokeh imports
from ..core.enums import OutputBackendType as OutputBackend
from .ui.ui_element import UIElement, _UIElementInit

class _CanvasInit(_UIElementInit, total=False):
    hidpi: bool
    output_backend: OutputBackend

class Canvas(UIElement):
    def __init__(self, **kwargs: Unpack[_CanvasInit]) -> None: ...

    hidpi: bool = ...
    output_backend: OutputBackend = ...
