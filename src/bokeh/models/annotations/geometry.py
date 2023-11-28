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

# Bokeh imports
from ...core.enums import CoordinateUnits, Dimension
from ...core.properties import (
    Bool,
    CoordinateLike,
    Enum,
    Float,
    Include,
    Instance,
    InstanceDefault,
    Null,
    Nullable,
    Override,
    Seq,
    UnitsSpec,
    field,
)
from ...core.property_aliases import BorderRadius
from ...core.property_mixins import (
    LineProps,
    ScalarFillProps,
    ScalarHatchProps,
    ScalarLineProps,
)
from ..common.properties import Coordinate
from ..coordinates import (
    FrameBottom,
    FrameLeft,
    FrameRight,
    FrameTop,
)
from .annotation import Annotation, DataAnnotation
from .arrows import ArrowHead, TeeHead

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Band",
    "BoxAnnotation",
    "PolyAnnotation",
    "Slope",
    "Span",
    "Whisker",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class BoxAnnotation(Annotation):
    ''' Render a shaded rectangular region as an annotation.

    See :ref:`ug_basic_annotations_box_annotations` for information on plotting box annotations.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    left = Coordinate(default=lambda: FrameLeft(), help="""
    The x-coordinates of the left edge of the box annotation.
    """).accepts(Null, lambda _value: FrameLeft())

    right = Coordinate(default=lambda: FrameRight(), help="""
    The x-coordinates of the right edge of the box annotation.
    """).accepts(Null, lambda _value: FrameRight())

    top = Coordinate(default=lambda: FrameTop(), help="""
    The y-coordinates of the top edge of the box annotation.
    """).accepts(Null, lambda _value: FrameTop())

    bottom = Coordinate(default=lambda: FrameBottom(), help="""
    The y-coordinates of the bottom edge of the box annotation.
    """).accepts(Null, lambda _value: FrameBottom())

    left_units = Enum(CoordinateUnits, default="data", help="""
    The unit type for the left attribute. Interpreted as |data units| by
    default.
    """)

    right_units = Enum(CoordinateUnits, default="data", help="""
    The unit type for the right attribute. Interpreted as |data units| by
    default.
    """)

    top_units = Enum(CoordinateUnits, default="data", help="""
    The unit type for the top attribute. Interpreted as |data units| by
    default.
    """)

    bottom_units = Enum(CoordinateUnits, default="data", help="""
    The unit type for the bottom attribute. Interpreted as |data units| by
    default.
    """)

    left_limit = Nullable(Coordinate, help="""
    Optional left limit for box movement.

    .. note::
        This property is experimental and may change at any point.
    """)

    right_limit = Nullable(Coordinate, help="""
    Optional right limit for box movement.

    .. note::
        This property is experimental and may change at any point.
    """)

    top_limit = Nullable(Coordinate, help="""
    Optional top limit for box movement.

    .. note::
        This property is experimental and may change at any point.
    """)

    bottom_limit = Nullable(Coordinate, help="""
    Optional bottom limit for box movement.

    .. note::
        This property is experimental and may change at any point.
    """)

    border_radius = BorderRadius(default=0, help="""
    Allows the box to have rounded corners.

    .. note::
        This property is experimental and may change at any point.
    """)

    editable = Bool(default=False, help="""
    Allows to interactively modify the geometry of this box.

    .. note::
        This property is experimental and may change at any point.
    """)

    resizable = Enum("none", "left", "right", "top", "bottom", "x", "y", "all", default="all", help="""
    If `editable` is set, this property allows to configure which
    combinations of edges are allowed to be moved, thus allows
    restrictions on resizing of the box.

    .. note::
        This property is experimental and may change at any point.
    """)

    movable = Enum("none", "x", "y", "both", default="both", help="""
    If `editable` is set, this property allows to configure in which
    directions the box can be moved.

    .. note::
        This property is experimental and may change at any point.
    """)

    symmetric = Bool(default=False, help="""
    Indicates whether the box is resizable around its center or its corners.

    .. note::
        This property is experimental and may change at any point.
    """)

    line_props = Include(ScalarLineProps, help="""
    The {prop} values for the box.
    """)

    fill_props = Include(ScalarFillProps, help="""
    The {prop} values for the box.
    """)

    hatch_props = Include(ScalarHatchProps, help="""
    The {prop} values for the box.
    """)

    hover_line_props = Include(ScalarLineProps, prefix="hover", help="""
    The {prop} values for the box when hovering over.
    """)

    hover_fill_props = Include(ScalarFillProps, prefix="hover", help="""
    The {prop} values for the box when hovering over.
    """)

    hover_hatch_props = Include(ScalarHatchProps, prefix="hover", help="""
    The {prop} values for the box when hovering over.
    """)

    line_color = Override(default="#cccccc")
    line_alpha = Override(default=0.3)

    fill_color = Override(default="#fff9ba")
    fill_alpha = Override(default=0.4)

    hover_line_color = Override(default=None)
    hover_line_alpha = Override(default=0.3)

    hover_fill_color = Override(default=None)
    hover_fill_alpha = Override(default=0.4)

class Band(DataAnnotation):
    ''' Render a filled area band along a dimension.

    See :ref:`ug_basic_annotations_bands` for information on plotting bands.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    lower = UnitsSpec(default=field("lower"), units_enum=CoordinateUnits, units_default="data", help="""
    The coordinates of the lower portion of the filled area band.
    """)

    upper = UnitsSpec(default=field("upper"), units_enum=CoordinateUnits, units_default="data", help="""
    The coordinates of the upper portion of the filled area band.
    """)

    base = UnitsSpec(default=field("base"), units_enum=CoordinateUnits, units_default="data", help="""
    The orthogonal coordinates of the upper and lower values.
    """)

    dimension = Enum(Dimension, default='height', help="""
    The direction of the band can be specified by setting this property
    to "height" (``y`` direction) or "width" (``x`` direction).
    """)

    line_props = Include(ScalarLineProps, help="""
    The {prop} values for the band.
    """)

    line_alpha = Override(default=0.3)

    line_color = Override(default="#cccccc")

    fill_props = Include(ScalarFillProps, help="""
    The {prop} values for the band.
    """)

    fill_alpha = Override(default=0.4)

    fill_color = Override(default="#fff9ba")


class PolyAnnotation(Annotation):
    ''' Render a shaded polygonal region as an annotation.

    See :ref:`ug_basic_annotations_polygon_annotations` for information on
    plotting polygon annotations.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    xs = Seq(CoordinateLike, default=[], help="""
    The x-coordinates of the region to draw.
    """)

    xs_units = Enum(CoordinateUnits, default='data', help="""
    The unit type for the ``xs`` attribute. Interpreted as |data units| by
    default.
    """)

    ys = Seq(CoordinateLike, default=[], help="""
    The y-coordinates of the region to draw.
    """)

    ys_units = Enum(CoordinateUnits, default='data', help="""
    The unit type for the ``ys`` attribute. Interpreted as |data units| by
    default.
    """)

    editable = Bool(default=False, help="""
    Allows to interactively modify the geometry of this polygon.

    .. note::
        This property is experimental and may change at any point.
    """)

    line_props = Include(ScalarLineProps, help="""
    The {prop} values for the polygon.
    """)

    fill_props = Include(ScalarFillProps, help="""
    The {prop} values for the polygon.
    """)

    hatch_props = Include(ScalarHatchProps, help="""
    The {prop} values for the polygon.
    """)

    hover_line_props = Include(ScalarLineProps, prefix="hover", help="""
    The {prop} values for the polygon when hovering over.
    """)

    hover_fill_props = Include(ScalarFillProps, prefix="hover", help="""
    The {prop} values for the polygon when hovering over.
    """)

    hover_hatch_props = Include(ScalarHatchProps, prefix="hover", help="""
    The {prop} values for the polygon when hovering over.
    """)

    line_color = Override(default="#cccccc")
    line_alpha = Override(default=0.3)

    fill_color = Override(default="#fff9ba")
    fill_alpha = Override(default=0.4)

    hover_line_color = Override(default=None)
    hover_line_alpha = Override(default=0.3)

    hover_fill_color = Override(default=None)
    hover_fill_alpha = Override(default=0.4)

class Slope(Annotation):
    """ Render a sloped line as an annotation.

    See :ref:`ug_basic_annotations_slope` for information on plotting slopes.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    gradient = Nullable(Float, help="""
    The gradient of the line, in |data units|
    """)

    y_intercept = Nullable(Float, help="""
    The y intercept of the line, in |data units|
    """)

    line_props = Include(ScalarLineProps, help="""
    The {prop} values for the line.
    """)

    above_fill_props = Include(ScalarFillProps, prefix="above", help="""
    The {prop} values for the area above the line.
    """)

    above_hatch_props = Include(ScalarHatchProps, prefix="above", help="""
    The {prop} values for the area above the line.
    """)

    below_fill_props = Include(ScalarFillProps, prefix="below", help="""
    The {prop} values for the area below the line.
    """)

    below_hatch_props = Include(ScalarHatchProps, prefix="below", help="""
    The {prop} values for the area below the line.
    """)

    above_fill_color = Override(default=None)
    above_fill_alpha = Override(default=0.4)

    below_fill_color = Override(default=None)
    below_fill_alpha = Override(default=0.4)

class Span(Annotation):
    """ Render a horizontal or vertical line span.

    See :ref:`ug_basic_annotations_spans` for information on plotting spans.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    location = Nullable(CoordinateLike, help="""
    The location of the span, along ``dimension``.
    """)

    location_units = Enum(CoordinateUnits, default='data', help="""
    The unit type for the location attribute. Interpreted as "data space"
    units by default.
    """)

    dimension = Enum(Dimension, default='width', help="""
    The direction of the span can be specified by setting this property
    to "height" (``y`` direction) or "width" (``x`` direction).
    """)

    editable = Bool(default=False, help="""
    Allows to interactively modify the geometry of this span.

    .. note::
        This property is experimental and may change at any point.
    """)

    line_props = Include(ScalarLineProps, help="""
    The {prop} values for the span.
    """)

    hover_line_props = Include(ScalarLineProps, prefix="hover", help="""
    The {prop} values for the span when hovering over.
    """)

    hover_line_color = Override(default=None)
    hover_line_alpha = Override(default=0.3)

class Whisker(DataAnnotation):
    ''' Render a whisker along a dimension.

    See :ref:`ug_basic_annotations_whiskers` for information on plotting whiskers.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    lower = UnitsSpec(default=field("lower"), units_enum=CoordinateUnits, units_default="data", help="""
    The coordinates of the lower end of the whiskers.
    """)

    lower_head = Nullable(Instance(ArrowHead), default=InstanceDefault(TeeHead, size=10), help="""
    Instance of ``ArrowHead``.
    """)

    upper = UnitsSpec(default=field("upper"), units_enum=CoordinateUnits, units_default="data", help="""
    The coordinates of the upper end of the whiskers.
    """)

    upper_head = Nullable(Instance(ArrowHead), default=InstanceDefault(TeeHead, size=10), help="""
    Instance of ``ArrowHead``.
    """)

    base = UnitsSpec(default=field("base"), units_enum=CoordinateUnits, units_default="data", help="""
    The orthogonal coordinates of the upper and lower values.
    """)

    dimension = Enum(Dimension, default='height', help="""
    The direction of the whisker can be specified by setting this property
    to "height" (``y`` direction) or "width" (``x`` direction).
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the whisker body.
    """)

    level = Override(default="underlay")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
