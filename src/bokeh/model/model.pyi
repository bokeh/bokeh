#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from inspect import Parameter
from typing import (
    Any,
    Final,
    Iterable,
    Self,
)

# Bokeh imports
from ..core.has_props import HasProps, Setter, abstract
from ..core.property.validation import without_property_validation
from ..core.query import SelectorType
from ..core.serialization import ObjectRefRep, Ref, Serializer
from ..core.types import ID
from ..document import Document
from ..document.events import DocumentPatchedEvent
from ..events import Event
from ..models.callbacks import (
    Callback as JSEventCallback,
    CustomCode as JSChangeCallback,
)
from ..util.callback_manager import (
    EventCallbackManager,
    PropertyCallback,
    PropertyCallbackManager,
)
from .util import HasDocumentRef

@abstract
@dataclass(init=False)
class Model(HasProps, HasDocumentRef, PropertyCallbackManager, EventCallbackManager):

    def destroy(self) -> None: ...

    id: Final[ID] = ...

    name: str | None = ...

    tags: list[Any] = ...

    js_event_callbacks: dict[str, list[JSEventCallback]] = ...

    js_property_callbacks: dict[str, list[JSEventCallback]] = ...

    subscribed_events: set[str] = ...

    syncable: bool = ...

    def __new__(cls, *args: Any, id: ID | None = None, **kwargs: Any) -> Self: ...

    @property
    def ref(self) -> Ref: ...

    @classmethod
    def clear_extensions(cls) -> None: ...

    @classmethod
    @without_property_validation
    def parameters(cls: type[Model]) -> list[Parameter]: ...

    def js_on_event(self, event: str | type[Event], *callbacks: JSEventCallback) -> None: ...

    def js_link(self, attr: str, other: Model, other_attr: str, attr_selector: int | str | None = None) -> None: ...

    def js_on_change(self, event: str, *callbacks: JSChangeCallback) -> None: ...

    def on_change(self, attr: str, *callbacks: PropertyCallback) -> None: ...

    def references(self) -> set[Model]: ...

    def select(self, selector: SelectorType) -> Iterable[Model]: ...

    def select_one(self, selector: SelectorType) -> Model | None: ...

    def set_select(self, selector: type[Model] | SelectorType, updates: dict[str, Any]) -> None: ...

    def to_serializable(self, serializer: Serializer) -> ObjectRefRep: ...

    def trigger(self, attr: str, old: Any, new: Any,
        hint: DocumentPatchedEvent | None = None, setter: Setter | None = None) -> None: ...

    def _attach_document(self, doc: Document) -> None: ...

    def _detach_document(self) -> None: ...
