#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from collections.abc import Mapping
from typing import Any, Protocol, Unpack

from ..layouts import LayoutDOM
from .widget import Widget, _WidgetInit

class _SupportsMarkdown(Protocol):
    def _repr_markdown_(self) -> str | tuple[str, Mapping[str, Any]] | None: ...

class _MarkdownInit(_WidgetInit, total=False):
    text: str | _SupportsMarkdown | None
    disable_math: bool
    embeds: dict[str, LayoutDOM]
    dedent: bool
    hard_line_break: bool
    disable_anchors: bool

class Markdown(Widget):
    def __init__(self, **kwargs: Unpack[_MarkdownInit]) -> None: ...

    @property
    def text(self) -> str: ...
    @text.setter
    def text(self, value: str | _SupportsMarkdown | None) -> None: ...
    disable_math: bool = ...
    embeds: dict[str, LayoutDOM] = ...
    dedent: bool = ...
    hard_line_break: bool = ...
    disable_anchors: bool = ...
