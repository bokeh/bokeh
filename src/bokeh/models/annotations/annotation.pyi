#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ...core.has_props import abstract
from ..renderers.renderer import CompositeRenderer
from ..sources import DataSource

@abstract
@dataclass(init=False)
class Annotation(CompositeRenderer):
    ...

@abstract
@dataclass(init=False)
class DataAnnotation(Annotation):

    source: DataSource = ...
