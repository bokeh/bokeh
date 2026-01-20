#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Unpack

# Bokeh imports
from .widget import Widget, WidgetInit

class MarkdownInit(WidgetInit, total=False):
    text: str
    disable_math: bool

class Markdown(Widget):
    def __init__(self, **kwargs: Unpack[MarkdownInit]) -> None: ...

    text: str = ...
    disable_math: bool = ...
