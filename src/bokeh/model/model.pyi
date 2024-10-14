from dataclasses import dataclass
from typing import Any, Final

from ..models.callbacks import Callback

class MetaHasProps(type):

    @property
    def model_class_reverse_map(cls) -> dict[str, type[HasProps]]:
        ...

@dataclass(init=False)
class HasProps(metaclass=MetaHasProps):

    id: Final[str] = ...

@dataclass(init=False)
class Model(HasProps):

    name: str | None = ...

    tags: list[Any] = ...

    js_event_callbacks: dict[str, list[Callback]] = ...

    js_property_callbacks: dict[str, list[Callback]] = ...

    subscribed_events: set[str] = ...

    syncable: bool = ...
