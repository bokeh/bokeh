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
from ..renderers.renderer import CompositeRenderer, CompositeRendererInit
from ..sources import DataSource

class AnnotationInit(CompositeRendererInit, total=False):
    ...

class Annotation(CompositeRenderer):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[AnnotationInit]) -> None: ...

class DataAnnotationInit(AnnotationInit, total=False):
    source: DataSource

class DataAnnotation(Annotation):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[DataAnnotationInit]) -> None: ...

    source: DataSource = ...
