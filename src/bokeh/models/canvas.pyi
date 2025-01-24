#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..core.enums import OutputBackendType as OutputBackend
from .ui import UIElement

@dataclass
class Canvas(UIElement):

    hidpi: bool = ...

    output_backend: OutputBackend = ...
