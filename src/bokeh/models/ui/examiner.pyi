#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ...core.has_props import HasProps
from .ui_element import UIElement, _UIElementInit

class _ExaminerInit(_UIElementInit, total=False):
    target: HasProps | None

class Examiner(UIElement):
    def __init__(self, **kwargs: Unpack[_ExaminerInit]) -> None: ...

    target: HasProps | None = ...
