# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Document Bokeh named colors.

The ``bokeh-color`` directive accepts a named color as its argument:

.. code-block:: rest

    .. bokeh-color:: aliceblue

and generates a labeled color swatch as output.

======

.. bokeh-color:: aliceblue

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
from docutils.parsers.rst.directives import unchanged

from bokeh.colors import named

from . import PARALLEL_SAFE, SphinxParallelSpec
from .bokeh_directive import BokehDirective
from .bokeh_markdown import markdown_block
from .templates import COLOR_DETAIL

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehColorDirective",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


class BokehColorDirective(BokehDirective):

    has_content = False
    required_arguments = 1
    option_spec = {
        "module": unchanged,
    }

    def run(self) -> list[Any]:
        color = self.arguments[0]

        css = getattr(named, color).to_css()
        html = COLOR_DETAIL.render(color=css, text=color)
        node = nodes.raw("", html, format="html")
        return [node, markdown_block(f"{color}: `{getattr(named, color).to_hex()}`")]


def setup(app: Any) -> SphinxParallelSpec:
    """ Required Sphinx extension setup function. """
    app.add_directive_to_domain("py", "bokeh-color", BokehColorDirective)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
