"""isort:skip_file"""
# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Provide a base class and useful functions for Bokeh Sphinx directives.

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

# Standard library imports
import re

# External imports
try:
    from docutils import nodes
    from docutils.statemachine import ViewList
    from sphinx.util.docutils import SphinxDirective
    from sphinx.util.nodes import nested_parse_with_titles
except Exception:  # pragma: no cover - only used in docs builds
    class _DirectiveStub:
        pass
    class _NodesStub:
        class paragraph:
            def __init__(self):
                self.document = None
    def nested_parse_with_titles(*args, **kwargs):
        return None
    nodes = _NodesStub()  # type: ignore[assignment]
    ViewList = list  # type: ignore[assignment]
    SphinxDirective = _DirectiveStub  # type: ignore[assignment]

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

# taken from Sphinx autodoc
py_sig_re = re.compile(
    r"""^ ([\w.]*\.)?            # class name(s)
          (\w+)  \s*             # thing name
          (?: \((.*)\)           # optional: arguments
           (?:\s* -> \s* (.*))?  # return annotation
          )? $                   # and nothing more
          """,
    re.VERBOSE,
)

__all__ = (
    "BokehDirective",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


class BokehDirective(SphinxDirective):

    def parse(self, rst_text, annotation):
        result = ViewList()
        for line in rst_text.split("\n"):
            result.append(line, annotation)
        node = nodes.paragraph()
        node.document = self.state.document
        nested_parse_with_titles(self.state, result, node)
        return node.children


# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
