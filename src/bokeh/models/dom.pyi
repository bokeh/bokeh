#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..core.enums import BuiltinFormatterType as BuiltinFormatter
from ..core.has_props import HasProps, abstract
from ..model import Model, Qualified
from .callbacks import CustomJS
from .css import Styles
from .renderers import RendererGroup
from .tools import CustomJSHover
from .ui import UIElement

@abstract
@dataclass(init=False)
class DOMNode(Model, Qualified):
    ...

@dataclass
class Text(DOMNode):

    content: str = ...

@abstract
@dataclass(init=False)
class DOMElement(DOMNode):

    style: Styles | dict[str, str] = ...

    children: list[str | DOMNode | UIElement] = ...

@dataclass
class Span(DOMElement):
    ...

@dataclass
class Div(DOMElement):
    ...

@dataclass
class Table(DOMElement):
    ...

@dataclass
class TableRow(DOMElement):
    ...

@abstract
@dataclass(init=False)
class Action(Model, Qualified):
    ...

@dataclass
class Template(DOMElement):

    actions: list[Action] = ...

@dataclass
class ToggleGroup(Action):

    groups: list[RendererGroup] = ...

@abstract
@dataclass(init=False)
class Placeholder(DOMElement):
    ...

@dataclass
class ValueOf(Placeholder):

    obj: HasProps = ...

    attr: str = ...

    format: str | None = ...

    formatter: BuiltinFormatter | CustomJS = ...

@dataclass
class Index(Placeholder):
    ...

@dataclass
class ValueRef(Placeholder):

    field: str = ...

    format: str | None = ...

    formatter: BuiltinFormatter | CustomJS | CustomJSHover = ...

    filter: CustomJS | list[CustomJS] | None = ...

@dataclass
class ColorRef(ValueRef):

    hex: bool = ...

    swatch: bool = ...

@dataclass
class HTML(DOMElement):

    html: str | list[str | DOMNode | UIElement] = ...

    refs: list[str | DOMNode | UIElement] = ...
