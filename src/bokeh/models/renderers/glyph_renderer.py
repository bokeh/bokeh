#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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

# pyright: reportAbstractUsage=false, reportArgumentType=false, reportAttributeAccessIssue=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from difflib import get_close_matches
from typing import TYPE_CHECKING, Any, Literal

from bokeh.core.property.vectorization import Field

from ...core.property.auto import Auto
from ...core.property.either import Either
from ...core.property.instance import Instance, InstanceDefault
from ...core.property.nullable import Nullable
from ...core.property.primitive import Bool
from ...core.property.required import Required
from ...core.validation import error
from ...core.validation.errors import BAD_COLUMN_NAME, DATAVIEW_FILTERS_WITH_CONNECTED
from ..filters import AllIndices
from ..glyph import ConnectedXYGlyph, Glyph
from ..graphics import Marking, PathDecoration, PathMarkings
from ..sources import (
    ColumnDataSource,
    DataView,
    IndexedDataSource,
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

    @error(DATAVIEW_FILTERS_WITH_CONNECTED)
    def _check_data_view_filters_with_connected(self):
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

    data_source = Required(Instance(IndexedDataSource), help="""
    Local data source to use when rendering glyphs on the plot.
    """)

    view = Instance(DataView, default=InstanceDefault(DataView), help="""
    A view into the data source to use when rendering glyphs. A default view
    of the entire data source is created when a view is not passed in during
    initialization.

    .. note:
        Only the default (filterless) DataView is compatible with glyphs that
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

    def add_path_decoration(self, marking: Marking, *, node: Literal["start", "middle", "end"],
            inset: Any = 0, selection_marking: Marking | Literal["auto"] | None = "auto",
            nonselection_marking: Marking | Literal["auto"] | None = "auto",
            hover_marking: Marking | Literal["auto"] | None = "auto",
            muted_marking: Marking | Literal["auto"] | None = "auto") -> PathDecoration:
        """Attach a marking to a named start, middle, or end node.

        Start and end honor inset and trim the shaft using endpoint tangents.
        Middle uses rear-to-tip chord alignment without inset or shaft trimming.
        Use add_path_markings() for fractional or repeated placements.
        State-specific markings require explicitly configured state glyphs.
        """
        decoration = PathDecoration(marking=marking, node=node, inset=inset)
        self._add_decoration(decoration, selection_marking=selection_marking,
                             nonselection_marking=nonselection_marking,
                             hover_marking=hover_marking, muted_marking=muted_marking)
        return decoration

    def add_path_markings(self, marking: Marking, *, positions: Any = None,
            selection_marking: Marking | Literal["auto"] | None = "auto",
            nonselection_marking: Marking | Literal["auto"] | None = "auto",
            hover_marking: Marking | Literal["auto"] | None = "auto",
            muted_marking: Marking | Literal["auto"] | None = "auto") -> PathMarkings:
        """Attach fractional markings, with one or more positions per path.

        A literal list of fractions applies to every path. A field references
        lists of fractions, one list per source row. Empty lists draw nothing.
        Markings use rear-to-tip chord alignment without shaft trimming or inset.
        Fractions 0 and 1 differ from named endpoints. Styling resolves per path.
        """
        decoration = PathMarkings(marking=marking, positions=[0.5] if positions is None else positions)
        self._add_decoration(decoration, selection_marking=selection_marking,
                             nonselection_marking=nonselection_marking,
                             hover_marking=hover_marking, muted_marking=muted_marking)
        return decoration

    def _add_decoration(self, decoration: PathDecoration | PathMarkings, *,
            selection_marking: Marking | Literal["auto"] | None = "auto",
            nonselection_marking: Marking | Literal["auto"] | None = "auto",
            hover_marking: Marking | Literal["auto"] | None = "auto",
            muted_marking: Marking | Literal["auto"] | None = "auto") -> None:
        states = [
            (self.selection_glyph, selection_marking),
            (self.nonselection_glyph, nonselection_marking),
            (self.hover_glyph, hover_marking),
            (self.muted_glyph, muted_marking),
        ]
        for glyph in [self.glyph, *(glyph for glyph, marking in states if marking is not None)]:
            if isinstance(glyph, Glyph) and not glyph._supports_path_decorations(decoration.node if isinstance(decoration, PathDecoration) else 0.5):
                operation = "add_path_decoration" if isinstance(decoration, PathDecoration) else "add_path_markings"
                raise ValueError(f"{operation}() does not support {type(glyph).__name__}. "
                                 "Use Segment, Line, MultiLine, Bezier, or Arc.")
        self.glyph.decorations.append(decoration)

        for glyph, state_marking in states:
            if not isinstance(glyph, Glyph) or state_marking is None:
                continue
            if state_marking == "auto":
                glyph.decorations.append(decoration)
            else:
                glyph.decorations.append(
                    PathDecoration(marking=state_marking, node=decoration.node, inset=decoration.inset)
                    if isinstance(decoration, PathDecoration) else
                    PathMarkings(marking=state_marking, positions=decoration.positions),
                )


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
        from ..glyph import FillGlyph, LineGlyph, TextGlyph
        from ..glyphs import Image, ImageStack
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
