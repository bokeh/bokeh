#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from collections.abc import Mapping, Sequence
from typing import (
    Any,
    Callable,
    ClassVar,
    Iterable,
    Literal,
    NoReturn,
    NotRequired,
    Self,
    TypedDict,
    overload,
)

# Bokeh imports
from ..client.session import ClientSession
from ..server.session import ServerSession
from ..util.compiler import Implementation
from .property.bases import Property
from .property.dataspec import DataSpec
from .property.descriptors import AliasPropertyDescriptor, PropertyDescriptor
from .serialization import (
    ObjectRep,
    Ref,
    Serializable,
    Serializer,
)

type Setter = ClientSession | ServerSession

def abstract[HasPropsType: type[HasProps]](cls: HasPropsType) -> HasPropsType: ...

def is_abstract(cls: type[HasProps]) -> bool: ...

def is_DataModel(cls: type[HasProps]) -> bool: ...

def _data_models_in_dependency_order(data_models: Iterable[type[HasProps]]) -> list[type[HasProps]]: ...

class _ModelResolver:
    ...

_default_resolver: _ModelResolver

class Local:
    ...

class Qualified:
    ...

class NonQualified:
    ...

class HasProps(Serializable):

    _initialized: bool = ...

    _property_values: dict[str, Any] = ...
    _materialized_defaults: dict[str, Any] = ...
    _materialized_themed_defaults: dict[str, Any] = ...

    model_class_reverse_map: ClassVar[dict[str, type[HasProps]]]

    __view_model__: ClassVar[str]
    __view_module__: ClassVar[str]
    __qualified_model__: ClassVar[str]
    __implementation__: ClassVar[str | Implementation]
    __data_model__: ClassVar[bool]
    __properties__: ClassVar[Mapping[str, Property[Any]]]
    __overridden_defaults__: ClassVar[Mapping[str, Any]]

    #def __init__(self, **properties: Any) -> None: ...

    #def __setattr__(self, name: str, value: Any) -> None: ...

    #def __getattr__(self, name: str) -> Any: ...

    def _raise_attribute_error_with_matches(self, name: str, properties: Iterable[str]) -> NoReturn: ...

    def __str__(self) -> str: ...

    __repr__ = __str__

    def equals(self, other: HasProps) -> bool: ...

    def to_serializable(self, serializer: Serializer) -> ObjectRep: ...

    def set_from_json(self, name: str, value: Any, *, setter: Setter | None = None) -> None: ...

    def update(self, **kwargs: Any) -> None: ...

    @overload
    @classmethod
    def lookup(cls, name: str, *, raises: Literal[True] = True) -> PropertyDescriptor[Any]: ...

    @overload
    @classmethod
    def lookup(cls, name: str, *, raises: Literal[False] = False) -> PropertyDescriptor[Any] | None: ...

    @classmethod
    def properties(cls) -> Mapping[str, Property[Any]]: ...

    @classmethod
    def descriptors(cls) -> Sequence[PropertyDescriptor[Any] | AliasPropertyDescriptor[Any]]: ...

    @classmethod
    def properties_with_refs(cls) -> Mapping[str, Property[Any]]: ...

    @classmethod
    def dataspecs(cls) -> Mapping[str, DataSpec]: ...

    def properties_with_values(self, *, include_defaults: bool = True, include_undefined: bool = False) -> dict[str, Any]: ...

    @classmethod
    def _overridden_defaults(cls) -> Mapping[str, Any]: ...

    def query_properties_with_values(self, query: Callable[[PropertyDescriptor[Any]], bool], *,
            include_defaults: bool = True, include_undefined: bool = False) -> dict[str, Any]: ...

    def themed_values(self) -> dict[str, Any] | None: ...

    def apply_theme(self, property_values: dict[str, Any]) -> None: ...

    def unapply_theme(self) -> None: ...

    def clone(self, **overrides: Any) -> Self: ...

type PrimitiveKindRef = Literal["Any", "Unknown", "Bool", "Float", "Int", "Bytes", "Str", "Null"]
type KindRef = (
    PrimitiveKindRef
    | tuple[Literal["Regex"], str]
    | tuple[Literal["Regex"], str, str]
    | tuple[Literal["Nullable"], KindRef]
    | tuple[Literal["Or"], KindRef, *tuple[KindRef, ...]]
    | tuple[Literal["Tuple"], KindRef, *tuple[KindRef, ...]]
    | tuple[Literal["List"], KindRef]
    | tuple[Literal["Struct"], *tuple[tuple[str, KindRef], ...]]
    | tuple[Literal["Dict"], KindRef]
    | tuple[Literal["Mapping"], KindRef, KindRef]
    | tuple[Literal["Enum"], *tuple[str, ...]]
    | tuple[Literal["Ref"], Ref]
    | tuple[Literal["AnyRef"]]
)

class PropertyDef(TypedDict):
    name: str
    kind: KindRef
    default: NotRequired[Any]

class OverrideDef(TypedDict):
    name: str
    default: Any

class ModelDef(TypedDict):
    type: Literal["model"]
    name: str
    extends: NotRequired[Ref | None]
    properties: NotRequired[list[PropertyDef]]
    overrides: NotRequired[list[OverrideDef]]
