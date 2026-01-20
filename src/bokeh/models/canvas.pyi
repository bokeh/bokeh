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
from .ui import UIElement, UIElementInit

class CanvasInit(UIElementInit, total=False):
    hidpi: bool
    output_backend: OutputBackend

class Canvas(UIElement):
    def __init__(self, **kwargs: Unpack[CanvasInit]) -> None: ...

    hidpi: bool = ...
    output_backend: OutputBackend = ...
