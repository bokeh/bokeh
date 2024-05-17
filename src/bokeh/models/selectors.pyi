# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..core.has_props import abstract
from ..model import Model

@abstract
@dataclass(init=False)
class Selector(Model):

    query: str = ...

@dataclass
class ByID(Selector):
    ...

@dataclass
class ByClass(Selector):
    ...

@dataclass
class ByCSS(Selector):
    ...

@dataclass
class ByXPath(Selector):
    ...
