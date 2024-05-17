# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ...core.has_props import abstract
from ..layouts import LayoutDOM

@abstract
@dataclass(init=False)
class Widget(LayoutDOM):
    ...
