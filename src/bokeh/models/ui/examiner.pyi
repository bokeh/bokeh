# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ...core.has_props import HasProps
from .ui_element import UIElement

@dataclass
class Examiner(UIElement):

    target: HasProps | None = ...
