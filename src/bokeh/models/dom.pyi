#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

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

class _TextInit(_ModelInit, total=False):
    content: str

class Text(DOMNode):
    def __init__(self, **kwargs: Unpack[_TextInit]) -> None: ...

    content: str = ...

class _DOMElementInit(_ModelInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class DOMElement(DOMNode):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DOMElementInit]) -> None: ...

    style: Styles | dict[str, str] = ...
    children: list[str | DOMNode | UIElement] = ...

class _SpanInit(_ModelInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class Span(DOMElement):
    def __init__(self, **kwargs: Unpack[_SpanInit]) -> None: ...

class _DivInit(_ModelInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class Div(DOMElement):
    def __init__(self, **kwargs: Unpack[_DivInit]) -> None: ...

class _TableInit(_ModelInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class Table(DOMElement):
    def __init__(self, **kwargs: Unpack[_TableInit]) -> None: ...

class _TableRowInit(_ModelInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class TableRow(DOMElement):
    def __init__(self, **kwargs: Unpack[_TableRowInit]) -> None: ...

class _ActionInit(_ModelInit, total=False):
    ...

class Action(Model, Qualified):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ActionInit]) -> None: ...

class _TemplateInit(_ModelInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]
    actions: list[Action]

class Template(DOMElement):
    def __init__(self, **kwargs: Unpack[_TemplateInit]) -> None: ...

    actions: list[Action] = ...

class _ToggleGroupInit(_ModelInit, total=False):
    groups: list[RendererGroup]

class ToggleGroup(Action):
    def __init__(self, **kwargs: Unpack[_ToggleGroupInit]) -> None: ...

    groups: list[RendererGroup] = ...

class _PlaceholderInit(_ModelInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class Placeholder(DOMElement):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_PlaceholderInit]) -> None: ...

class _ValueOfInit(_ModelInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]
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

class _IndexInit(_ModelInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class Index(Placeholder):
    def __init__(self, **kwargs: Unpack[_IndexInit]) -> None: ...

class _ValueRefInit(_ModelInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]
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

class _ColorRefInit(_ModelInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]
    field: str
    format: str | None
    formatter: BuiltinFormatter | CustomJS | CustomJSHover
    filter: CustomJS | list[CustomJS] | None
    hex: bool
    swatch: bool

class ColorRef(ValueRef):
    def __init__(self, **kwargs: Unpack[_ColorRefInit]) -> None: ...

    hex: bool = ...
    swatch: bool = ...

class _HTMLInit(_ModelInit, total=False):
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]
    html: str | list[str | DOMNode | UIElement]
    refs: list[str | DOMNode | UIElement]

class HTML(DOMElement):
    def __init__(self, **kwargs: Unpack[_HTMLInit]) -> None: ...

    html: str | list[str | DOMNode | UIElement] = ...
    refs: list[str | DOMNode | UIElement] = ...
