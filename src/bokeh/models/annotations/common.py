#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Common utilities for annotation models. """

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# Bokeh imports
from ...core.property.singletons import Undefined
from ..glyphs import Glyph
from ..renderers import GlyphRenderer, Renderer
from ..sources import ColumnDataSource

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def build_glyph_renderer(model: type[Glyph], kwargs: dict[str, Any]) -> GlyphRenderer:
    """ Builds a ``GlyphRenderer`` to behave like an annotation. """
    defaults = dict(level="annotation")
    glyph_renderer_kwargs = {}

    for name in Renderer.properties():
        default = defaults.get(name, Undefined)
        value = kwargs.pop(name, default)
        glyph_renderer_kwargs[name] = value

    data_source = kwargs.pop("source", Undefined)
    if data_source is Undefined:
        data_source = ColumnDataSource()

    return GlyphRenderer(
        data_source=data_source,
        glyph=model(**kwargs),
        auto_ranging="none",
        **glyph_renderer_kwargs,
    )

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
