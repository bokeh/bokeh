#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from inspect import Parameter
from typing import (
    Any,
    Iterable,
    Literal,
    Self,
    TypedDict,
    Unpack,
)

from ..core.has_props import HasProps, Setter
from ..core.property.validation import without_property_validation
from ..core.query import SelectorType
from ..core.serialization import (
    ObjectRefRep,
    ObjectRep,
    Ref,
    Serializer,
)
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

class Throttle:
    wait: float
    def __init__(self, wait: float) -> None: ...
class Debounce:
    wait: float
    def __init__(self, wait: float) -> None: ...
class Committed: ...
type CallbackPolicy = Throttle | Debounce | Committed
type _CallbackPolicy = tuple[Literal["immediate", "committed"], None] | tuple[Literal["throttle", "debounce"], float]

class _ModelInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    syncable: bool

class Model(HasProps, HasDocumentRef, PropertyCallbackManager, EventCallbackManager):

    # TODO Final[ID]
    id: ID = ...

    def __init__(self, **kwargs: Unpack[_ModelInit]) -> None: ...

    # Don't override __new__, because then you will have to overload it every time
    # you overload __init__ with a custom signature (in e.g. ranges or figure).
    @classmethod
    def _new(cls, id: ID) -> Self | None: ...

    name: str | None = ...
    tags: list[Any] = ...
    _js_event_callbacks: dict[str, list[JSEventCallback]] = ...
    _js_property_callback_policies: dict[str, dict[str, list[_CallbackPolicy]]] = ...
    _js_property_callbacks: dict[str, list[JSEventCallback]] = ...
    _subscribed_changes: dict[str, list[_CallbackPolicy]] = ...
    _subscribed_events: set[str] = ...
    syncable: bool = ...

    def destroy(self) -> None: ...

    @property
    def ref(self) -> Ref: ...

    @classmethod
    def clear_extensions(cls) -> None: ...

    @classmethod
    @without_property_validation
    def parameters(cls: type[Model]) -> list[Parameter]: ...

    def js_on_event(self, event: str | type[Event], *callbacks: JSEventCallback) -> None: ...
    def js_remove_on_event(self, event: str | type[Event], *callbacks: JSEventCallback) -> None: ...

    def js_link(self, attr: str, other: Model, other_attr: str, attr_selector: int | str | None = None) -> None: ...

    def js_on_change(self, event: str, *callbacks: JSChangeCallback,
        policy: CallbackPolicy | None = ...) -> None: ...
    def js_remove_on_change(self, event: str, *callbacks: JSChangeCallback) -> None: ...

    def on_change(self, attr: str, *callbacks: PropertyCallback,
        policy: CallbackPolicy | None = ...) -> None: ...

    def remove_on_change(self, attr: str, *callbacks: PropertyCallback) -> None: ...

    def _callback_policy_for_change(self, attr: str) -> _CallbackPolicy | None: ...

    def _set_from_json_with_callback_policy(self, attr: str, value: Any,
        policy: tuple[str, float | None], *, setter: Setter | None = ...) -> None: ...

    def references(self) -> set[Model]: ...

    def select(self, selector: SelectorType) -> Iterable[Model]: ...

    def select_one(self, selector: SelectorType) -> Model | None: ...

    def set_select(self, selector: type[Model] | SelectorType, updates: dict[str, Any]) -> None: ...

    def to_serializable(self, serializer: Serializer) -> ObjectRep | ObjectRefRep: ...

    def trigger(self, attr: str, old: Any, new: Any,
        hint: DocumentPatchedEvent | None = None, setter: Setter | None = None) -> None: ...

    def _attach_document(self, doc: Document) -> None: ...

    def _detach_document(self) -> None: ...
