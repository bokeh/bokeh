#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from functools import lru_cache
from typing import (
    Any,
    Callable,
    ClassVar,
    Iterable,
    Literal,
    NoReturn,
    NotRequired,
    Self,
    TypeAlias,
    TypedDict,
    TypeVar,
    overload,
)

# Bokeh imports
from ..client.session import ClientSession
from ..server.session import ServerSession
from .property.bases import Property
from .property.dataspec import DataSpec
from .property.descriptors import PropertyDescriptor
from .serialization import (
    ObjectRep,
    Ref,
    Serializable,
    Serializer,
)

Setter: TypeAlias = ClientSession | ServerSession

HasPropsType = TypeVar("HasPropsType", bound=type[HasProps])

def abstract(cls: HasPropsType) -> HasPropsType: ...

def is_abstract(cls: type[HasProps]) -> bool: ...

def is_DataModel(cls: type[HasProps]) -> bool: ...

class MetaHasProps(type):

    __properties__: dict[str, Property[Any]]
    __overridden_defaults__: dict[str, Any]
    __themed_values__: dict[str, Any]

    def __new__(cls, class_name: str, bases: tuple[type, ...], class_dict: dict[str, Any]) -> HasProps: ...

    def __init__(cls, class_name: str, bases: tuple[type, ...], _) -> None: ...

    @property
    def model_class_reverse_map(cls) -> dict[str, type[HasProps]]: ...

class Local:
    ...

class Qualified:
    ...

class NonQualified:
    ...

class HasProps(Serializable, metaclass=MetaHasProps):

    _initialized: bool = ...

    _property_values: dict[str, Any] = ...
    _unstable_default_values: dict[str, Any] = ...
    _unstable_themed_values: dict[str, Any] = ...

    __view_model__: ClassVar[str]
    __view_module__: ClassVar[str]
    __qualified_model__: ClassVar[str]
    __implementation__: ClassVar[Any] # TODO: specific type
    __data_model__: ClassVar[bool]

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
    def lookup(cls, name: str, *, raises: bool = True) -> PropertyDescriptor[Any] | None: ...

    @overload
    @classmethod
    @lru_cache(None)
    def properties(cls, *, _with_props: Literal[False] = False) -> set[str]: ...

    @overload
    @classmethod
    @lru_cache(None)
    def properties(cls, *, _with_props: Literal[True] = True) -> dict[str, Property[Any]]: ...

    @classmethod
    @lru_cache(None)
    def properties(cls, *, _with_props: bool = False) -> set[str] | dict[str, Property[Any]]: ...

    @classmethod
    @lru_cache(None)
    def descriptors(cls) -> list[PropertyDescriptor[Any]]: ...

    @classmethod
    @lru_cache(None)
    def properties_with_refs(cls) -> dict[str, Property[Any]]: ...

    @classmethod
    @lru_cache(None)
    def dataspecs(cls) -> dict[str, DataSpec]: ...

    def properties_with_values(self, *, include_defaults: bool = True, include_undefined: bool = False) -> dict[str, Any]: ...

    @classmethod
    def _overridden_defaults(cls) -> dict[str, Any]: ...

    def query_properties_with_values(self, query: Callable[[PropertyDescriptor[Any]], bool], *,
            include_defaults: bool = True, include_undefined: bool = False) -> dict[str, Any]: ...

    def themed_values(self) -> dict[str, Any] | None: ...

    def apply_theme(self, property_values: dict[str, Any]) -> None: ...

    def unapply_theme(self) -> None: ...

    def clone(self, **overrides: Any) -> Self: ...

KindRef = Any # TODO

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
