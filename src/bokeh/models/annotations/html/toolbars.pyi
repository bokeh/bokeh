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
from ...tools import Toolbar
from .html_annotation import HTMLAnnotation, _HTMLAnnotationInit

class _ToolbarPanelInit(_HTMLAnnotationInit, total=False):
    toolbar: Toolbar

class ToolbarPanel(HTMLAnnotation):
    def __init__(self, **kwargs: Unpack[_ToolbarPanelInit]) -> None: ...

    toolbar: Toolbar = ...
