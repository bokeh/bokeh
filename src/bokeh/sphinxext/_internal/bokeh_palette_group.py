# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Generate visual representations of palettes in Bokeh palette groups.

The ``bokeh.palettes`` modules expose attributes such as ``mpl``, ``brewer``,
and ``d3`` that provide groups of palettes. The ``bokeh-palette-group``
directive accepts the name of one of these groups, and generates a visual
matrix of colors for every palette in the group.

As an example, the following usage of the directive:

.. code-block:: rest

    .. bokeh-palette-group:: mpl

Generates the output:

-----

.. bokeh-palette-group:: mpl

"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations

import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

from typing import Any

from docutils import nodes
from docutils.parsers.rst import Directive
from sphinx.errors import SphinxError

import bokeh.palettes as bp

from . import PARALLEL_SAFE, SphinxParallelSpec
from .bokeh_markdown import MARKDOWN_FORMAT
from .templates import PALETTE_GROUP_DETAIL

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "bokeh_palette_group",
    "BokehPaletteGroupDirective",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


class bokeh_palette_group(nodes.General, nodes.Element):

    @staticmethod
    def visit_html(visitor: Any, node: Any) -> None:
        visitor.body.append('<div class="container-fluid"><div class="row">')
        group = getattr(bp, node["group"], None)
        if not isinstance(group, dict):
            group_name = node["group"]
            raise SphinxError(f"invalid palette group name {group_name}")
        names = sorted(group)
        for name in names:
            palettes = group[name]
            # arbitrary cutoff here, idea is to not show large (e.g. 256 length) palettes
            numbers = [x for x in sorted(palettes) if x < 30]
            html = PALETTE_GROUP_DETAIL.render(name=name, numbers=numbers, palettes=palettes)
            visitor.body.append(html)
        visitor.body.append("</div></div>")
        raise nodes.SkipNode

    html = visit_html.__func__, None # type: ignore[attr-defined]

    @staticmethod
    def visit_markdown(visitor: Any, node: Any) -> None:
        visitor.add(_palette_group_markdown(node["group"]), prefix_eol=2, suffix_eol=2)
        raise nodes.SkipNode

    markdown = visit_markdown.__func__, None # type: ignore[attr-defined]


class BokehPaletteGroupDirective(Directive):

    has_content = False
    required_arguments = 1

    def run(self) -> list[Any]:
        node = bokeh_palette_group()
        node["group"] = self.arguments[0]
        return [node]


def setup(app: Any) -> SphinxParallelSpec:
    """ Required Sphinx extension setup function. """
    app.add_node(bokeh_palette_group, html=bokeh_palette_group.html, **{MARKDOWN_FORMAT: bokeh_palette_group.markdown})
    app.add_directive("bokeh-palette-group", BokehPaletteGroupDirective)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------


def _palette_group(group_name: str) -> dict[str, dict[int, Any]]:
    group = getattr(bp, group_name, None)
    if not isinstance(group, dict):
        raise SphinxError(f"invalid palette group name {group_name}")
    return group


def _palette_group_markdown(group_name: str) -> str:
    # One line per palette, with the colors of its largest displayed size.
    # Smaller sizes of a palette are listed by size only.
    lines = []
    for name, palettes in sorted(_palette_group(group_name).items()):
        # same cutoff as the HTML version, to not show large (e.g. 256 length) palettes
        numbers = [x for x in sorted(palettes) if x < 30]
        if not numbers:
            continue
        sizes = ", ".join(str(number) for number in numbers)
        colors = ", ".join(f"`{color}`" for color in palettes[numbers[-1]])
        lines.append(f"* **{name}** (sizes: {sizes}). {name}{numbers[-1]}: {colors}")
    return "\n".join(lines)

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
