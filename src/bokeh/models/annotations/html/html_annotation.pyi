# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ....core.has_props import abstract
from ..annotation import Annotation

@abstract
@dataclass(init=False)
class HTMLAnnotation(Annotation):
    ...
