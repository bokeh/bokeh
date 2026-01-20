#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Unpack

# Bokeh imports
from ...core.has_props import HasProps
from .ui_element import UIElement, UIElementInit

class ExaminerInit(UIElementInit, total=False):
    target: HasProps | None

class Examiner(UIElement):
    def __init__(self, **kwargs: Unpack[ExaminerInit]) -> None: ...

    target: HasProps | None = ...
