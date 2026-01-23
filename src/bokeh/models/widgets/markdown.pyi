#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Unpack

# Bokeh imports
from .widget import Widget, _WidgetInit

class _MarkdownInit(_WidgetInit, total=False):
    text: str
    disable_math: bool

class Markdown(Widget):
    def __init__(self, **kwargs: Unpack[_MarkdownInit]) -> None: ...

    text: str = ...
    disable_math: bool = ...
