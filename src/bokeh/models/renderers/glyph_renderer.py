#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''
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
from difflib import get_close_matches
from typing import TYPE_CHECKING, Literal

# Bokeh imports
from ...core.properties import (
    Auto,
    Bool,
    Either,
    Instance,
    InstanceDefault,
    Nullable,
    Required,
)
from ...core.validation import error
from ...core.validation.errors import BAD_COLUMN_NAME, CDSVIEW_FILTERS_WITH_CONNECTED
from ..filters import AllIndices
from ..glyphs import ConnectedXYGlyph, Glyph
from ..graphics import Decoration, Marking
from ..sources import (
    CDSView,
    ColumnDataSource,
    DataSource,
    WebDataSource,
)
from .renderer import DataRenderer

if TYPE_CHECKING:
    from ..annotations import ColorBar

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "GlyphRenderer",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class GlyphRenderer(DataRenderer):
    '''

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    @error(CDSVIEW_FILTERS_WITH_CONNECTED)
    def _check_cdsview_filters_with_connected(self):
        if isinstance(self.glyph, ConnectedXYGlyph) and not isinstance(self.view.filter, AllIndices):
            return str(self)

    @error(BAD_COLUMN_NAME)
    def _check_bad_column_name(self):
        if isinstance(self.data_source, WebDataSource):
            return
        missing_values = set()
        specs = self.glyph.dataspecs()
        for name, item in self.glyph.properties_with_values(include_defaults=False).items():
            if name not in specs: continue
            if not isinstance(item, dict): continue
            if not isinstance(self.data_source, ColumnDataSource): continue
            if 'field' in item and item['field'] not in self.data_source.column_names:
                missing_values.add((item['field'], name))
        if missing_values:
            suggestions = ['" (closest match: "%s")' % s[0] if s else '"' for s in [
                get_close_matches(term[0], self.data_source.column_names, n=1) for term in missing_values]]
            missing_values = [("".join([m[0], s]), m[1]) for m, s in zip(missing_values, suggestions)]
            missing = [f'key "{k}" value "{v}' for v, k in missing_values]
            return "{} [renderer: {}]".format(", ".join(sorted(missing)), self)

    data_source = Required(Instance(DataSource), help="""
    Local data source to use when rendering glyphs on the plot.
    """)

    view = Instance(CDSView, default=InstanceDefault(CDSView), help="""
    A view into the data source to use when rendering glyphs. A default view
    of the entire data source is created when a view is not passed in during
    initialization.

    .. note:
        Only the default (filterless) CDSView is compatible with glyphs that
        have connected topology, such as Line and Patch. Setting filters on
        views for these glyphs will result in a warning and undefined behavior.
    """)

    glyph = Required(Instance(Glyph), help="""
    The glyph to render, in conjunction with the supplied data source
    and ranges.
    """)

    selection_glyph = Nullable(Either(Auto, Instance(Glyph)), default="auto", help=""""
    An optional glyph used for selected points.

    If set to "auto" then the standard glyph will be used for selected
    points.
    """)

    nonselection_glyph = Nullable(Either(Auto, Instance(Glyph)), default="auto", help=""""
    An optional glyph used for explicitly non-selected points
    (i.e., non-selected when there are other points that are selected,
    but not when no points at all are selected.)

    If set to "auto" then a glyph with a low alpha value (0.1) will
    be used for non-selected points.
    """)

    hover_glyph = Nullable(Instance(Glyph), help="""
    An optional glyph used for inspected points, e.g., those that are
    being hovered over by a ``HoverTool``.
    """)

    muted_glyph = Nullable(Either(Auto, Instance(Glyph)), default="auto", help=""""
    """)

    muted = Bool(False, help="""
    """)

    def add_decoration(self, marking: Marking, node: Literal["start", "middle", "end"]) -> Decoration:
        glyphs = [self.glyph, self.selection_glyph, self.nonselection_glyph, self.hover_glyph, self.muted_glyph]
        decoration = Decoration(marking=marking, node=node)

        for glyph in glyphs:
            if isinstance(glyph, Glyph):
                glyph.decorations.append(decoration)

        return decoration

    def construct_color_bar(self, visual: Literal["fill", "line"] = "fill", **kwargs) -> ColorBar:
        ''' Construct and return a new ``ColorBar`` for this ``GlyphRenderer``.

        Args:
            visual ("fill" or "line", optional):
                Which visual field to use for constructing a color bar (default: "fill")

        Returns:
            ColorBar

        The constructed color bar will use the fill or line color mapper from
        the  GlyphRenderer's main glyph, as specified by ``visual``. Extra
        keyword arguments may be passed in to control ``ColorBar`` properties
        such as `title`.

        '''
        from ...core.property.vectorization import Field
        from ..annotations import ColorBar
        from ..mappers import ColorMapper

        if visual == "fill":
            fill_color = self.glyph.fill_color
            if not (isinstance(fill_color, Field) and isinstance(fill_color.transform, ColorMapper)):
                raise ValueError("construct_color_bar expects fill_color to be a field with a colormapper transform")
            return ColorBar(color_mapper=fill_color.transform, **kwargs)

        elif visual == "line":
            line_color = self.glyph.line_color
            if not (isinstance(line_color, Field) and isinstance(line_color.transform, ColorMapper)):
                raise ValueError("construct_color_bar expects line_color to be a field with a colormapper transform")
            return ColorBar(color_mapper=line_color.transform, **kwargs)

        else:
            raise ValueError(f"construct_color_bar expects 'fill' or 'line' for visual, got {visual!r}")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
