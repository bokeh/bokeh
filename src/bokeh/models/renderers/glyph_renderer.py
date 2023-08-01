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
from typing import TYPE_CHECKING, Any, Literal

# Bokeh imports
from bokeh.core.property.vectorization import Field

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
        source = self.data_source

        if not isinstance(source, ColumnDataSource) or isinstance(source, WebDataSource):
            return

        colnames = source.column_names

        props = self.glyph.properties_with_values(include_defaults=False)
        specs = self.glyph.dataspecs().keys() & props.keys()

        missing = []

        for spec in sorted(specs):
            if isinstance(props[spec], Field) and (field := props[spec].field) not in colnames:
                if close := get_close_matches(field, colnames, n=1):
                    missing.append(f"{spec}={field!r} [closest match: {close[0]!r}]")
                else:
                    missing.append(f"{spec}={field!r} [no close matches]")

        if missing:
            return f"{', '.join(missing)} {{renderer: {self}}}"

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

    selection_glyph = Nullable(Either(Auto, Instance(Glyph)), default="auto", help="""
    An optional glyph used for selected points.

    If set to "auto" then the standard glyph will be used for selected
    points.
    """)

    nonselection_glyph = Nullable(Either(Auto, Instance(Glyph)), default="auto", help="""
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

    muted_glyph = Nullable(Either(Auto, Instance(Glyph)), default="auto", help="""
    An optional glyph that replaces the primary glyph when ``muted`` is set. If
    set to ``"auto"``, it will create a new glyph based off the primary glyph
    with predefined visual properties.
    """)

    muted = Bool(default=False, help="""
    Defines whether this glyph renderer is muted or not. Muted renderer will use
    the muted glyph instead of the primary glyph for rendering. Usually renderers
    are muted by the user through an UI action, e.g. by clicking a legend item, if
    a legend was configured with ``click_policy = "mute"``.
    """)

    def add_decoration(self, marking: Marking, node: Literal["start", "middle", "end"]) -> Decoration:
        glyphs = [self.glyph, self.selection_glyph, self.nonselection_glyph, self.hover_glyph, self.muted_glyph]
        decoration = Decoration(marking=marking, node=node)

        for glyph in glyphs:
            if isinstance(glyph, Glyph):
                glyph.decorations.append(decoration)

        return decoration

    def construct_color_bar(self, **kwargs: Any) -> ColorBar:
        ''' Construct and return a new ``ColorBar`` for this ``GlyphRenderer``.

        The function will check for a color mapper on an appropriate property
        of the GlyphRenderer's main glyph, in this order:

        * ``fill_color.transform`` for FillGlyph
        * ``line_color.transform`` for LineGlyph
        * ``text_color.transform`` for TextGlyph
        * ``color_mapper`` for Image

        In general, the function will "do the right thing" based on glyph type.
        If different behavior is needed, ColorBars can be constructed by hand.

        Extra keyword arguments may be passed in to control ``ColorBar``
        properties such as `title`.

        Returns:
            ColorBar

        '''
        from ...core.property.vectorization import Field
        from ..annotations import ColorBar
        from ..glyphs import (
            FillGlyph,
            Image,
            ImageStack,
            LineGlyph,
            TextGlyph,
        )
        from ..mappers import ColorMapper

        if isinstance(self.glyph, FillGlyph):
            fill_color = self.glyph.fill_color
            if not (isinstance(fill_color, Field) and isinstance(fill_color.transform, ColorMapper)):
                raise ValueError("expected fill_color to be a field with a ColorMapper transform")
            return ColorBar(color_mapper=fill_color.transform, **kwargs)

        elif isinstance(self.glyph, LineGlyph):
            line_color = self.glyph.line_color
            if not (isinstance(line_color, Field) and isinstance(line_color.transform, ColorMapper)):
                raise ValueError("expected line_color to be a field with a ColorMapper transform")
            return ColorBar(color_mapper=line_color.transform, **kwargs)

        elif isinstance(self.glyph, TextGlyph):
            text_color = self.glyph.text_color
            if not (isinstance(text_color, Field) and isinstance(text_color.transform, ColorMapper)):
                raise ValueError("expected text_color to be a field with a ColorMapper transform")
            return ColorBar(color_mapper=text_color.transform, **kwargs)

        elif isinstance(self.glyph, (Image, ImageStack)):
            return ColorBar(color_mapper=self.glyph.color_mapper, **kwargs)

        else:
            raise ValueError(f"construct_color_bar does not handle glyph type {type(self.glyph).__name__}")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
