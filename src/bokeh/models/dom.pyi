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
from ..model.model import Model, _ModelInit
from .callbacks import CustomJS
from .css import Styles
from .renderers import RendererGroup
from .tools import CustomJSHover
from .ui import UIElement

class _DOMNodeInit(_ModelInit, total=False):
    ...

class DOMNode(Model, Qualified):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DOMNodeInit]) -> None: ...

class _TextInit(_DOMNodeInit, total=False):
    content: str

class Text(DOMNode):
    def __init__(self, **kwargs: Unpack[_TextInit]) -> None: ...

    content: str = ...

class _DOMElementInit(_DOMNodeInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class DOMElement(DOMNode):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DOMElementInit]) -> None: ...

    style: Styles | dict[str, str] = ...
    children: list[str | DOMNode | UIElement] = ...

class _SpanInit(_DOMElementInit, total=False):
    ...

class Span(DOMElement):
    def __init__(self, **kwargs: Unpack[_SpanInit]) -> None: ...

class _DivInit(_DOMElementInit, total=False):
    ...

class Div(DOMElement):
    def __init__(self, **kwargs: Unpack[_DivInit]) -> None: ...

class _TableInit(_DOMElementInit, total=False):
    ...

class Table(DOMElement):
    def __init__(self, **kwargs: Unpack[_TableInit]) -> None: ...

class _TableRowInit(_DOMElementInit, total=False):
    ...

class TableRow(DOMElement):
    def __init__(self, **kwargs: Unpack[_TableRowInit]) -> None: ...

class _ActionInit(_ModelInit, total=False):
    ...

class Action(Model, Qualified):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ActionInit]) -> None: ...

class _TemplateInit(_DOMElementInit, total=False):
    actions: list[Action]

class Template(DOMElement):
    def __init__(self, **kwargs: Unpack[_TemplateInit]) -> None: ...

    actions: list[Action] = ...

class _ToggleGroupInit(_ActionInit, total=False):
    groups: list[RendererGroup]

class ToggleGroup(Action):
    def __init__(self, **kwargs: Unpack[_ToggleGroupInit]) -> None: ...

    groups: list[RendererGroup] = ...

class _PlaceholderInit(_DOMElementInit, total=False):
    ...

class Placeholder(DOMElement):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_PlaceholderInit]) -> None: ...

class _ValueOfInit(_PlaceholderInit, total=False):
    obj: HasProps
    attr: str
    format: str | None
    formatter: BuiltinFormatter | CustomJS

class ValueOf(Placeholder):
    def __init__(self, **kwargs: Unpack[_ValueOfInit]) -> None: ...

    obj: HasProps = ...
    attr: str = ...
    format: str | None = ...
    formatter: BuiltinFormatter | CustomJS = ...

class _IndexInit(_PlaceholderInit, total=False):
    ...

class Index(Placeholder):
    def __init__(self, **kwargs: Unpack[_IndexInit]) -> None: ...

class _ValueRefInit(_PlaceholderInit, total=False):
    field: str
    format: str | None
    formatter: BuiltinFormatter | CustomJS | CustomJSHover
    filter: CustomJS | list[CustomJS] | None

class ValueRef(Placeholder):
    def __init__(self, **kwargs: Unpack[_ValueRefInit]) -> None: ...

    field: str = ...
    format: str | None = ...
    formatter: BuiltinFormatter | CustomJS | CustomJSHover = ...
    filter: CustomJS | list[CustomJS] | None = ...

class _ColorRefInit(_ValueRefInit, total=False):
    hex: bool
    swatch: bool

class ColorRef(ValueRef):
    def __init__(self, **kwargs: Unpack[_ColorRefInit]) -> None: ...

    hex: bool = ...
    swatch: bool = ...

class _HTMLInit(_DOMElementInit, total=False):
    html: str | list[str | DOMNode | UIElement]
    refs: list[str | DOMNode | UIElement]

class HTML(DOMElement):
    def __init__(self, **kwargs: Unpack[_HTMLInit]) -> None: ...

    html: str | list[str | DOMNode | UIElement] = ...
    refs: list[str | DOMNode | UIElement] = ...
