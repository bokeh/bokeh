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

from collections.abc import Sequence
from difflib import get_close_matches
from typing import TYPE_CHECKING, Any, Literal

import numpy as np

from bokeh.core.property.vectorization import Field

from ...core.property.auto import Auto
from ...core.property.container import List
from ...core.property.either import Either
from ...core.property.instance import Instance, InstanceDefault
from ...core.property.nullable import Nullable
from ...core.property.primitive import Bool
from ...core.property.required import Required
from ...core.property.singletons import _NotGiven
from ...core.validation import error
from ...core.validation.errors import (
    BAD_COLUMN_NAME,
    INDEXEDSUBSET_FILTERS_WITH_CONNECTED,
)
from ..filters import AllIndices
from ..glyph import ConnectedXYGlyph, Glyph, SupportsPathMarking
from ..graphics import Marking, PathPlacement
from ..sources import (
    ColumnDataSource,
    IndexedDataSource,
    IndexedSubset,
    WebDataSource,
)
from ._glyph_attachment import GlyphAttachment
from .renderer import DataRenderer

if TYPE_CHECKING:
    from ...core.enums import AngleReferenceType
    from ..annotations import ArrowHead, ColorBar

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

    @error(INDEXEDSUBSET_FILTERS_WITH_CONNECTED)
    def _check_indexed_subset_filters_with_connected(self):
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

    attachments = List(Instance(GlyphAttachment), help="""
    Internal models painted with this renderer.
    """)

    data_source = Required(Instance(IndexedDataSource), help="""
    Local data source to use when rendering glyphs on the plot.
    """)

    view = Instance(IndexedSubset, default=InstanceDefault(IndexedSubset), help="""
    A view into the data source to use when rendering glyphs. A default view
    of the entire data source is created when a view is not passed in during
    initialization.

    .. note:
        Only the default (filterless) IndexedSubset is compatible with glyphs that
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

    def add_path_marking(self, marking: Marking, *,
            at: Literal["start", "middle", "end"] | float | Sequence[float] | np.ndarray | Field | dict[str, Any],
            inset: Any = _NotGiven, angle: Any = 0, angle_reference: AngleReferenceType = "auto",
            selection_marking: Marking | Literal["auto"] | None = "auto",
            nonselection_marking: Marking | Literal["auto"] | None = "auto",
            hover_marking: Marking | Literal["auto"] | None = "auto",
            muted_marking: Marking | Literal["auto"] | None = "auto") -> PathPlacement:
        """Attach a marking to named or fractional positions along a path.

        Fractions measure screen-space path length and must be between 0 and 1.
        A field supplies a list of fractions per source row. An empty list skips
        that row.

        Only named start and end placements accept an inset, measured in screen
        pixels. In the default orientation those placements also trim the shaft.
        Middle and fractional placements leave the shaft intact.

        State-specific markings require explicitly configured state glyphs.
        """
        if inset is not _NotGiven and not (isinstance(at, str) and at in ("start", "end")):
            raise ValueError("inset requires at='start' or at='end'")

        nodes = ("start", "middle", "end")
        positions: Any
        if isinstance(at, str):
            if at not in nodes:
                message = f"unknown path marking placement {at!r}. Use 'start', 'middle', 'end', a fraction, a sequence of fractions, or a field spec."
                if matches := get_close_matches(at, nodes, n=1):
                    message += f" Did you mean {matches[0]!r}?"
                raise ValueError(f"{message} Use field({at!r}) to refer to a source column.")
            positions = at
        elif isinstance(at, Field):
            if not isinstance(at.field, str):
                raise ValueError("the path marking placement field name must be a string")
            positions = at
        elif isinstance(at, dict) and "field" in at:
            positions = at
        elif isinstance(at, np.ndarray):
            if at.ndim != 1:
                raise ValueError("path marking placement arrays must be one-dimensional")
            positions = at.tolist()
        elif isinstance(at, Sequence) and not isinstance(at, (bytes, bytearray)):
            positions = list(at)
        else:
            positions = [at]

        path_marking = PathPlacement(marking=marking, positions=positions, inset=0 if inset is _NotGiven else inset,
                                 angle=angle, angle_reference=angle_reference)
        return self._add_path_marking(path_marking, selection_marking=selection_marking,
                                    nonselection_marking=nonselection_marking,
                                    hover_marking=hover_marking, muted_marking=muted_marking)

    def add_arrowheads(self, *, at: Literal["start", "middle", "end"] | float | Sequence[float] | np.ndarray | Field | dict[str, Any] = "end",
            head: ArrowHead | Literal["auto"] = "auto",
            angle: Any = 0, angle_reference: AngleReferenceType = "auto") -> PathPlacement:
        """Add arrowheads using :meth:`add_path_marking`.

        The default placement is ``"end"``. The default ``OpenHead`` inherits
        the shaft's line color, alpha, and width. Pass an arrowhead model to
        customize its size and visuals.
        """
        from ..annotations.arrows import auto_arrowhead

        marking = auto_arrowhead() if head == "auto" else head
        return self.add_path_marking(marking, at=at, angle=angle, angle_reference=angle_reference)

    def _add_path_marking(self, path_marking: PathPlacement, *,
            selection_marking: Marking | Literal["auto"] | None = "auto",
            nonselection_marking: Marking | Literal["auto"] | None = "auto",
            hover_marking: Marking | Literal["auto"] | None = "auto",
            muted_marking: Marking | Literal["auto"] | None = "auto") -> PathPlacement:
        states = [
            (self.selection_glyph, selection_marking),
            (self.nonselection_glyph, nonselection_marking),
            (self.hover_glyph, hover_marking),
            (self.muted_glyph, muted_marking),
        ]
        glyph = self.glyph
        if not isinstance(glyph, SupportsPathMarking):
            raise ValueError(f"add_path_marking() does not support {type(glyph).__name__}.")

        for state_glyph, marking in states:
            if marking is not None and isinstance(state_glyph, Glyph) and not isinstance(state_glyph, SupportsPathMarking):
                raise ValueError(f"add_path_marking() does not support {type(state_glyph).__name__}.")
        glyph.path_markings.append(path_marking)

        for glyph, state_marking in states:
            if not isinstance(glyph, SupportsPathMarking) or state_marking is None:
                continue
            if state_marking == "auto":
                glyph.path_markings.append(path_marking)
            else:
                glyph.path_markings.append(PathPlacement(marking=state_marking,
                    positions=path_marking.positions, inset=path_marking.inset, angle=path_marking.angle,
                    angle_units=path_marking.angle_units, angle_reference=path_marking.angle_reference))

        return path_marking

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
