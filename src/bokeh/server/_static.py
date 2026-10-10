#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Shared static-route definitions for Bokeh server frontends."""

from __future__ import annotations

# Standard library imports
import re

BOKEH_JS_BUNDLE_NAMES = (
    "bokeh",
    "bokeh-api",
    "bokeh-embed-bootstrap",
    "bokeh-gl",
    "bokeh-mathjax",
    "bokeh-tables",
    "bokeh-widgets",
)

BOKEH_JS_ROUTE_PATTERN = (
    rf"js/(?:{'|'.join(re.escape(name) for name in BOKEH_JS_BUNDLE_NAMES)})"
    r"(?:\.esm)?(?:\.min)?\.js"
)


def is_bokeh_js_path(relative: str) -> bool:
    """Return whether a relative static path names a shipped BokehJS bundle."""
    return re.fullmatch(BOKEH_JS_ROUTE_PATTERN, relative) is not None


__all__ = ("BOKEH_JS_ROUTE_PATTERN", "is_bokeh_js_path")
