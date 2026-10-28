#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Component for displaying Markdown formatted contents.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportAbstractUsage=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from collections.abc import Mapping
from typing import Any

from ...core.property.container import Dict
from ...core.property.instance import Instance
from ...core.property.primitive import Bool
from ...core.property.string import MathString, Regex
from ..layouts import LayoutDOM
from .widget import Widget

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Markdown",
)

def _markdown_text(value: Any) -> str:
    if isinstance(value, str):
        return value
    if value is None:
        return ""
    method = getattr(value, "_repr_markdown_", None)
    if not callable(method):
        raise ValueError("expected a string, None, or an object with a callable _repr_markdown_()")
    result = method()
    if result is None:
        return ""
    if isinstance(result, tuple):
        if len(result) != 2 or not isinstance(result[1], Mapping):
            raise ValueError("_repr_markdown_() must return a string, a (string, metadata mapping) tuple, or None")
        result = result[0]
    if not isinstance(result, str):
        raise ValueError("_repr_markdown_() must return a string, a (string, metadata mapping) tuple, or None")
    return result

class _MarkdownText(MathString):
    def validate(self, value: Any, detail: bool = True) -> None:
        if value is None or isinstance(value, str) or callable(getattr(value, "_repr_markdown_", None)):
            return
        raise ValueError("expected a string, None, or an object with a callable _repr_markdown_()")

    def transform(self, value: Any) -> str:
        # Conversion is required even when property validation is disabled.
        return _markdown_text(value)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Markdown(Widget):
    """ A component for displaying Markdown formatted contents.

    Fenced code blocks with a language name are syntax highlighted in the
    browser using Highlight.js's common language set, including Python,
    JavaScript, HTML, CSS, and SQL. Blocks with an unknown language or no
    language name are displayed as plain text.

    Headings receive GitHub-style IDs and permalink anchors. Link to a heading
    with a fragment such as ``[Code blocks](#code-blocks)``. Repeated headings
    receive numeric suffixes such as ``code-blocks-1``.
    Existing HTML heading IDs are preserved. Generated IDs avoid collisions
    with HTML anchors and footnotes in the same widget.
    Explicit IDs can also be written as ``## Heading {#custom-id}``, where
    the ID starts with a letter and contains letters, digits, underscores,
    or hyphens. Repeated explicit Markdown IDs and IDs matching footnote or
    HTML targets receive numeric suffixes to keep targets unique.

    Admonitions use GitHub-style blockquotes beginning with ``[!NOTE]``,
    ``[!TIP]``, ``[!IMPORTANT]``, ``[!WARNING]``, or ``[!CAUTION]``.
    Definition lists put a term on its own line followed by one or more
    ``: definition`` lines, with indented continuation paragraphs.
    Collapsible sections use HTML ``<details>`` and ``<summary>`` elements.
    Separate their HTML tags from Markdown content with blank lines.

    Footnotes use references such as ``[^note]`` and definitions such as
    ``[^note]: Additional information.``. Notes appear at the end of the
    contents with links back to their references.

    """

    text = _MarkdownText(default="", help="""
    The text with Markdown syntax to display.

    Also accepts objects with a callable ``_repr_markdown_()`` method.
    The method may return a string, a ``(string, metadata)`` tuple, or None.
    Metadata must be a mapping and is ignored. None, either supplied directly
    or returned by the method, displays empty content.

    Conversion happens in Python on construction or assignment. The stored
    value is a string snapshot, and changes to the original object do not
    automatically update the widget. Reassign the object to refresh it.

    See https://www.markdownlang.com/cheatsheet/ for syntax details.
    """)

    disable_math = Bool(False, help="""
    Whether the contents should not be processed as TeX/LaTeX input.
    """)

    dedent = Bool(True, help="""
    Whether to remove common leading whitespace from nonblank lines before
    parsing Markdown. Relative indentation, including code blocks, is preserved.
    Set to False to interpret the original indentation literally.
    """)

    hard_line_break = Bool(False, help="""
    Whether soft line breaks in paragraphs should render as hard line breaks.
    Code blocks retain their original line breaks.
    """)

    disable_anchors = Bool(False, help="""
    Whether to disable generated heading IDs and heading permalink links.
    Explicit Markdown and HTML IDs and footnote links remain available.
    """)

    embeds = Dict(Regex(r"^[A-Za-z0-9_.-]+\Z"), Instance(LayoutDOM), default={}, help="""
    Named Bokeh models to display in standalone ``::bokeh[name]`` blocks.

    Names may contain ASCII letters, digits, underscores, hyphens, and periods.
    Each model can appear once, even if multiple names refer to it. Missing
    names, repeated references, and failed view initialization display a message
    in the Markdown contents.
    Ancestor layouts cannot be embedded. Unreferenced models do not create
    views. Embedded models retain their state when surrounding text changes,
    and use their own sizing properties.
    A widget with embedded models fills the width its enclosing container
    provides by default. Set ``sizing_mode="stretch_width"`` on an enclosing
    row or column to make that layout fill the available page width. Explicit
    width and sizing policies on this widget take precedence.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
