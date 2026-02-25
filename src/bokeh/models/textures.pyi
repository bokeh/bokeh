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
from ..core.enums import TextureRepetitionType as TextureRepetition
from ..core.property.visual import ImageType as Image
from ..model.model import Model

from ..model.model import JSEventCallback
from typing import Any
from typing import TypedDict

class _TextureInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    repetition: TextureRepetition

class Texture(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_TextureInit]) -> None: ...

    repetition: TextureRepetition = ...

class _CanvasTextureInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    repetition: TextureRepetition
    code: str

class CanvasTexture(Texture):
    def __init__(self, **kwargs: Unpack[_CanvasTextureInit]) -> None: ...

    code: str = ...

class _ImageURLTextureInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    repetition: TextureRepetition
    url: Image

class ImageURLTexture(Texture):
    def __init__(self, **kwargs: Unpack[_ImageURLTextureInit]) -> None: ...

    url: Image = ...
