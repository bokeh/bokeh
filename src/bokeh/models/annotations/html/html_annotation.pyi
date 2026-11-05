#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from abc import abstractmethod
from typing import Unpack

from ..annotation import Annotation, _AnnotationInit

class _HTMLAnnotationInit(_AnnotationInit, total=False):
    ...

class HTMLAnnotation(Annotation):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_HTMLAnnotationInit]) -> None: ...
