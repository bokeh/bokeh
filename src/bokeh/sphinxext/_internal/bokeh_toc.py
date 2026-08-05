# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""Customize the Bokeh documentation table of contents."""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations

import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# External imports
from docutils import nodes
from sphinx.environment import BuildEnvironment

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = ()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

_REFERENCE_DOC_PREFIX = "docs/reference/"


def _shorten_reference_toc_titles(app: object, env: BuildEnvironment) -> None:
    """Use the final component of qualified Bokeh module titles in navigation."""
    for docname, toc in env.tocs.items():
        if not docname.startswith(_REFERENCE_DOC_PREFIX):
            continue

        for reference in toc.findall(nodes.reference):
            if reference.get("refuri") != docname or reference.get("anchorname"):
                continue

            title = reference.astext()
            if title.startswith("bokeh."):
                reference.children[:] = [nodes.Text(title.rsplit(".", maxsplit=1)[-1])]
            break

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
