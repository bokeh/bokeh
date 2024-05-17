# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..model import Model
from .ranges import Range
from .scales import Scale

@dataclass
class CoordinateMapping(Model):

    x_source: Range = ...

    y_source: Range = ...

    x_scale: Scale = ...

    y_scale: Scale = ...

    x_target: Range = ...

    y_target: Range = ...
