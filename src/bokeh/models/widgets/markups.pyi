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
from .widget import Widget, _WidgetInit

class _MarkupInit(_WidgetInit, total=False):
    text: str
    disable_math: bool

class Markup(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MarkupInit]) -> None: ...

    text: str = ...
    disable_math: bool = ...

class _ParagraphInit(_MarkupInit, total=False):
    ...

class Paragraph(Markup):
    def __init__(self, **kwargs: Unpack[_ParagraphInit]) -> None: ...

class _DivInit(_MarkupInit, total=False):
    render_as_text: bool

class Div(Markup):
    def __init__(self, **kwargs: Unpack[_DivInit]) -> None: ...

    render_as_text: bool = ...

class _PreTextInit(_ParagraphInit, total=False):
    ...

class PreText(Paragraph):
    def __init__(self, **kwargs: Unpack[_PreTextInit]) -> None: ...
