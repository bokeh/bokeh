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
from ..core.enums import TextureRepetitionType as TextureRepetition
from ..core.property.visual import ImageType as Image
from ..model.model import Model, ModelInit

class TextureInit(ModelInit, total=False):
    repetition: TextureRepetition

class Texture(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[TextureInit]) -> None: ...

    repetition: TextureRepetition = ...

class CanvasTextureInit(TextureInit, total=False):
    code: str

class CanvasTexture(Texture):
    def __init__(self, **kwargs: Unpack[CanvasTextureInit]) -> None: ...

    code: str = ...

class ImageURLTextureInit(TextureInit, total=False):
    url: Image

class ImageURLTexture(Texture):
    def __init__(self, **kwargs: Unpack[ImageURLTextureInit]) -> None: ...

    url: Image = ...
