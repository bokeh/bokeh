# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..dom import DOMNode
from .ui_element import UIElement

@dataclass
class Pane(UIElement):

    elements: list[UIElement | DOMNode] = ...
