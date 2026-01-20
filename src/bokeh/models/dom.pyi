#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Unpack

# Bokeh imports
from ..core.enums import BuiltinFormatterType as BuiltinFormatter
from ..core.has_props import HasProps, Qualified
from ..model.model import Model, ModelInit
from .callbacks import CustomJS
from .css import Styles
from .renderers import RendererGroup
from .tools import CustomJSHover
from .ui import UIElement

class DOMNodeInit(ModelInit, total=False):
    ...

class DOMNode(Model, Qualified):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[DOMNodeInit]) -> None: ...

class TextInit(DOMNodeInit, total=False):
    content: str

class Text(DOMNode):
    def __init__(self, **kwargs: Unpack[TextInit]) -> None: ...

    content: str = ...

class DOMElementInit(DOMNodeInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class DOMElement(DOMNode):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[DOMElementInit]) -> None: ...

    style: Styles | dict[str, str] = ...
    children: list[str | DOMNode | UIElement] = ...

class SpanInit(DOMElementInit, total=False):
    ...

class Span(DOMElement):
    def __init__(self, **kwargs: Unpack[SpanInit]) -> None: ...

class DivInit(DOMElementInit, total=False):
    ...

class Div(DOMElement):
    def __init__(self, **kwargs: Unpack[DivInit]) -> None: ...

class TableInit(DOMElementInit, total=False):
    ...

class Table(DOMElement):
    def __init__(self, **kwargs: Unpack[TableInit]) -> None: ...

class TableRowInit(DOMElementInit, total=False):
    ...

class TableRow(DOMElement):
    def __init__(self, **kwargs: Unpack[TableRowInit]) -> None: ...

class ActionInit(ModelInit, total=False):
    ...

class Action(Model, Qualified):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ActionInit]) -> None: ...

class TemplateInit(DOMElementInit, total=False):
    actions: list[Action]

class Template(DOMElement):
    def __init__(self, **kwargs: Unpack[TemplateInit]) -> None: ...

    actions: list[Action] = ...

class ToggleGroupInit(ActionInit, total=False):
    groups: list[RendererGroup]

class ToggleGroup(Action):
    def __init__(self, **kwargs: Unpack[ToggleGroupInit]) -> None: ...

    groups: list[RendererGroup] = ...

class PlaceholderInit(DOMElementInit, total=False):
    ...

class Placeholder(DOMElement):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[PlaceholderInit]) -> None: ...

class ValueOfInit(PlaceholderInit, total=False):
    obj: HasProps
    attr: str
    format: str | None
    formatter: BuiltinFormatter | CustomJS

class ValueOf(Placeholder):
    def __init__(self, **kwargs: Unpack[ValueOfInit]) -> None: ...

    obj: HasProps = ...
    attr: str = ...
    format: str | None = ...
    formatter: BuiltinFormatter | CustomJS = ...

class IndexInit(PlaceholderInit, total=False):
    ...

class Index(Placeholder):
    def __init__(self, **kwargs: Unpack[IndexInit]) -> None: ...

class ValueRefInit(PlaceholderInit, total=False):
    field: str
    format: str | None
    formatter: BuiltinFormatter | CustomJS | CustomJSHover
    filter: CustomJS | list[CustomJS] | None

class ValueRef(Placeholder):
    def __init__(self, **kwargs: Unpack[ValueRefInit]) -> None: ...

    field: str = ...
    format: str | None = ...
    formatter: BuiltinFormatter | CustomJS | CustomJSHover = ...
    filter: CustomJS | list[CustomJS] | None = ...

class ColorRefInit(ValueRefInit, total=False):
    hex: bool
    swatch: bool

class ColorRef(ValueRef):
    def __init__(self, **kwargs: Unpack[ColorRefInit]) -> None: ...

    hex: bool = ...
    swatch: bool = ...

class HTMLInit(DOMElementInit, total=False):
    html: str | list[str | DOMNode | UIElement]
    refs: list[str | DOMNode | UIElement]

class HTML(DOMElement):
    def __init__(self, **kwargs: Unpack[HTMLInit]) -> None: ...

    html: str | list[str | DOMNode | UIElement] = ...
    refs: list[str | DOMNode | UIElement] = ...
