# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..core.enums import OutputBackendType as OutputBackend
from .ui import UIElement

@dataclass
class Canvas(UIElement):

    hidpi: bool = ...

    output_backend: OutputBackend = ...
