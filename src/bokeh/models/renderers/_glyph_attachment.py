#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Models for internal renderer attachments. """

from __future__ import annotations

from typing import Any, cast

from ...core.has_props import abstract
from ...core.property.color import Color
from ...core.property.container import Seq
from ...core.property.dataspec import NullStringSpec
from ...core.property.either import Either
from ...core.property.instance import Instance, InstanceDefault
from ...core.property.nullable import Nullable
from ...core.property.numeric import NonNegative, Percent
from ...core.property.override import Override
from ...core.property.primitive import Bool, Float, String
from ...core.property_mixins import ScalarTextProps
from ...model import Model
from ..formatters import PrintfTickFormatter, TickFormatter


@abstract
class GlyphAttachment(Model):
    """ Internal base class for models painted by a glyph renderer. """

class ContourLabels(GlyphAttachment, ScalarTextProps):
    """ Public model for labels on contour lines.

    Use :meth:`~bokeh.models.ContourRenderer.add_labels` to attach the labels to
    a contour renderer, then update the returned model to change their
    formatting, placement, or appearance. Import this model from
    ``bokeh.models``.
    """

    text = NullStringSpec(default=None, help="""
    Text from the contour line source or a literal value. The default formats
    each row's contour level.
    """)

    formatter = Instance(TickFormatter, default=cast(Any, InstanceDefault(PrintfTickFormatter, format="%.3g")), help="""
    Formatter for contour levels when automatic text is used.
    """)

    positions = Nullable(Either(Seq(Percent), String), help="""
    Screen path length fractions for each level, or a column containing one
    sequence of fractions per level. The default chooses a position automatically.
    """)

    visible = Bool(default=True, help="Whether to draw the labels.")

    inline_gap = Bool(default=False, help="""
    Clip contour strokes underneath labels on canvas and WebGL plots.
    SVG plots and SVG exports draw labels over continuous strokes.
    """)

    gap_padding = NonNegative(Float, default=2, help="""
    Padding around each inline gap, in screen pixels.
    """)

    background_fill_color = Nullable(Color, help="Color of the label background.")

    background_fill_alpha = Percent(default=1, help="Opacity of the label background.")

    text_font_size = Override(default="9pt")  # pyright: ignore[reportAssignmentType]
    text_align = Override(default="center")  # pyright: ignore[reportAssignmentType]
    text_baseline = Override(default="middle")  # pyright: ignore[reportAssignmentType]
