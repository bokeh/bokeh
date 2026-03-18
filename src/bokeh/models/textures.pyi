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
from ..model.model import Model, _ModelInit

class _TextureInit(_ModelInit, total=False):
    repetition: TextureRepetition

class Texture(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_TextureInit]) -> None: ...

    repetition: TextureRepetition = ...

class _CanvasTextureInit(_TextureInit, total=False):
    code: str

class CanvasTexture(Texture):
    def __init__(self, **kwargs: Unpack[_CanvasTextureInit]) -> None: ...

    code: str = ...

class _ImageURLTextureInit(_TextureInit, total=False):
    url: Image

class ImageURLTexture(Texture):
    def __init__(self, **kwargs: Unpack[_ImageURLTextureInit]) -> None: ...

    url: Image = ...
