#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from abc import abstractmethod
from typing import Unpack

from ..renderers.renderer import CompositeRenderer, _CompositeRendererInit

class _AnnotationInit(_CompositeRendererInit, total=False):
    ...

class Annotation(CompositeRenderer):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_AnnotationInit]) -> None: ...
