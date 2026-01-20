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
from .widget import Widget, WidgetInit

class MarkupInit(WidgetInit, total=False):
    text: str
    disable_math: bool

class Markup(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[MarkupInit]) -> None: ...

    text: str = ...
    disable_math: bool = ...

class ParagraphInit(MarkupInit, total=False):
    ...

class Paragraph(Markup):
    def __init__(self, **kwargs: Unpack[ParagraphInit]) -> None: ...

class DivInit(MarkupInit, total=False):
    render_as_text: bool

class Div(Markup):
    def __init__(self, **kwargs: Unpack[DivInit]) -> None: ...

    render_as_text: bool = ...

class PreTextInit(ParagraphInit, total=False):
    ...

class PreText(Paragraph):
    def __init__(self, **kwargs: Unpack[PreTextInit]) -> None: ...
