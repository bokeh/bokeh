#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..core.enums import TextureRepetitionType as TextureRepetition
from ..core.has_props import abstract
from ..core.property.visual import ImageType as Image
from ..model import Model

@abstract
@dataclass(init=False)
class Texture(Model):

    repetition: TextureRepetition = ...

@dataclass
class CanvasTexture(Texture):

    code: str = ...

@dataclass
class ImageURLTexture(Texture):

    url: Image = ...
