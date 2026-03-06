#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Sequence, TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..core.enums import (
    AutoType as Auto,
    BuiltinFormatterType as BuiltinFormatter,
    DimensionsType as Dimensions,
    OutlineShapeNameType as OutlineShapeName,
)
from ..core.has_props import HasProps, Qualified
from ..model.model import JSEventCallback, Model, _ModelInit
from .callbacks import CustomJS
from .css import Styles
from .renderers import RendererGroup
from .tools import CustomJSHover
from .ui import UIElement
from ..core.property_aliases import BorderRadius, Padding, TextAnchorType as TextAnchor
from ..core.property_mixins import (AlphaSpec, DashPatternSpec, FontSizeSpec, HatchPatternSpec, IntSpec, LineCapSpec, LineJoinSpec, TextBaselineSpec)
from .._specs import (
    AngleSpec,
    ColorSpec,
    DataSpec,
    FloatSpec,
    FontStyleSpec,
    NumberSpec,
    StringSpec,
    TextAlignSpec,
)
from .._types import NonNegative
from .textures import Texture
from .layouts import (AlignType as Align, FlowModeType as FlowMode, SizingModeType as SizingMode, SizingPolicyType as SizingPolicy)
from .renderers.glyph_renderer import Decoration
from .ui.ui_element import (Menu, Node, StyleSheet)

# class _DOMNodeInit(_ModelInit, total=False):
#     ...

class _DOMNodeInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class DOMNode(Model, Qualified):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DOMNodeInit]) -> None: ...

# class _TextInit(_DOMNodeInit, total=False):
#     content: str

class _TextInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    content: str
class Text(DOMNode):
    def __init__(self, **kwargs: Unpack[_TextInit]) -> None: ...

    content: str = ...
#     style: Styles | dict[str, str]
#     children: list[str | DOMNode | UIElement]

class _DOMElementInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class DOMElement(DOMNode):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DOMElementInit]) -> None: ...

    style: Styles | dict[str, str] = ...
    children: list[str | DOMNode | UIElement] = ...

# class _SpanInit(_DOMElementInit, total=False):
#     ...

class _SpanInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class Span(DOMElement):
    def __init__(self, **kwargs: Unpack[_SpanInit]) -> None: ...

# class _DivInit(_DOMElementInit, total=False):
#     ...

class _DivInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]
class Div(DOMElement):
    def __init__(self, **kwargs: Unpack[_DivInit]) -> None: ...

# class _TableInit(_DOMElementInit, total=False):
#     ...

class _TableInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class Table(DOMElement):
    def __init__(self, **kwargs: Unpack[_TableInit]) -> None: ...

# class _TableRowInit(_DOMElementInit, total=False):
#     ...

class _TableRowInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class TableRow(DOMElement):
    def __init__(self, **kwargs: Unpack[_TableRowInit]) -> None: ...

# class _ActionInit(_ModelInit, total=False):
#     ...

class _ActionInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class Action(Model, Qualified):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ActionInit]) -> None: ...

# class _TemplateInit(_DOMElementInit, total=False):
#     actions: list[Action]

class _TemplateInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]
    actions: list[Action]

class Template(DOMElement):
    def __init__(self, **kwargs: Unpack[_TemplateInit]) -> None: ...

    actions: list[Action] = ...

# class _ToggleGroupInit(_ActionInit, total=False):
#     groups: list[RendererGroup]

class _ToggleGroupInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    groups: list[RendererGroup]

class ToggleGroup(Action):
    def __init__(self, **kwargs: Unpack[_ToggleGroupInit]) -> None: ...

    groups: list[RendererGroup] = ...

# class _PlaceholderInit(_DOMElementInit, total=False):
#     ...

class _PlaceholderInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class Placeholder(DOMElement):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_PlaceholderInit]) -> None: ...

# class _ValueOfInit(_PlaceholderInit, total=False):
#     obj: HasProps
#     attr: str
#     format: str | None
#     formatter: BuiltinFormatter | CustomJS

class _ValueOfInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
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

# class _IndexInit(_PlaceholderInit, total=False):
#     ...

class _IndexInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]

class Index(Placeholder):
    def __init__(self, **kwargs: Unpack[_IndexInit]) -> None: ...

# class _ValueRefInit(_PlaceholderInit, total=False):
#     field: str
#     format: str | None
#     formatter: BuiltinFormatter | CustomJS | CustomJSHover
#     filter: CustomJS | list[CustomJS] | None

class _ValueRefInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
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

# class _ColorRefInit(_ValueRefInit, total=False):
#     hex: bool
#     swatch: bool

class _ColorRefInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
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

# class _HTMLInit(_DOMElementInit, total=False):
#     html: str | list[str | DOMNode | UIElement]
#     refs: list[str | DOMNode | UIElement]

class _HTMLInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    style: Styles | dict[str, str]
    children: list[str | DOMNode | UIElement]
    html: str | list[str | DOMNode | UIElement]
    refs: list[str | DOMNode | UIElement]

class HTML(DOMElement):
    def __init__(self, **kwargs: Unpack[_HTMLInit]) -> None: ...

    html: str | list[str | DOMNode | UIElement] = ...
    refs: list[str | DOMNode | UIElement] = ...
