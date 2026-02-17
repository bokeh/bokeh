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
from ..renderers.renderer import CompositeRenderer, _CompositeRendererInit
from ..sources import DataSource

class _AnnotationInit(_CompositeRendererInit, total=False):
    ...

class Annotation(CompositeRenderer):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_AnnotationInit]) -> None: ...

class _DataAnnotationInit(_AnnotationInit, total=False):
    source: DataSource

class DataAnnotation(Annotation):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DataAnnotationInit]) -> None: ...

    source: DataSource = ...
