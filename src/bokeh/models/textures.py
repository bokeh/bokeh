#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# Bokeh imports
from ..core.enums import TextureRepetition
from ..core.has_props import abstract
from ..core.properties import (
    Enum,
    Image,
    Required,
    String,
)
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CanvasTexture',
    'ImageURLTexture',
    'Texture',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Texture(Model):
    ''' Base class for ``Texture`` models that represent fill patterns.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    repetition = Enum(TextureRepetition, default="repeat", help="""

    """)

class CanvasTexture(Texture):
    '''

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    code = Required(String, help="""
    A snippet of JavaScript code to execute in the browser.
    """)

class ImageURLTexture(Texture):
    '''

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    url = Required(Image, help="""
    A URL to a drawable resource like image, video, etc.

    If provided with a file path, the file will be encoded using ``data:``
    protocol (utf-8 encoding for ``*.svg`` and base64 for ``*.png`` and
    other binary formats).

    NumPy 2D arrays are also supported and use ``data:`` encoding as well.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
