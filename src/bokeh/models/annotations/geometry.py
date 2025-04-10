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

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from math import inf
from typing import Any

# Bokeh imports
from ...core.enums import (
    CoordinateUnits,
    Dimension,
    Movable,
    Resizable,
)
from ...core.properties import (
    Bool,
    CoordinateLike,
    Enum,
    Float,
    Include,
    Instance,
    InstanceDefault,
    NonNegative,
    Null,
    Nullable,
    Override,
    Positive,
    Required,
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
from ...model import Model
from ..common.properties import Coordinate
from ..nodes import BoxNodes, Node
from .annotation import Annotation, DataAnnotation
from .arrows import ArrowHead, TeeHead

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Band",
    "BoxAnnotation",
    "BoxInteractionHandles",
    "PolyAnnotation",
    "Slope",
    "Span",
    "Whisker",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class AreaVisuals(Model):
    """ Allows to style line, fill and hatch visuals. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

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

class BoxInteractionHandles(Model):
    """ Defines interaction handles for box-like annotations.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    all          = Required(Instance(AreaVisuals)) # move, resize

    move         = Nullable(Instance(AreaVisuals))
    resize       = Nullable(Instance(AreaVisuals)) # sides, corners

    sides        = Nullable(Instance(AreaVisuals)) # left, right, top, bottom
    corners      = Nullable(Instance(AreaVisuals)) # top_left, top_right, bottom_left, bottom_right

    left         = Nullable(Instance(AreaVisuals))
    right        = Nullable(Instance(AreaVisuals))
    top          = Nullable(Instance(AreaVisuals))
    bottom       = Nullable(Instance(AreaVisuals))

    top_left     = Nullable(Instance(AreaVisuals))
    top_right    = Nullable(Instance(AreaVisuals))
    bottom_left  = Nullable(Instance(AreaVisuals))
    bottom_right = Nullable(Instance(AreaVisuals))

DEFAULT_BOX_ANNOTATION_HANDLES = lambda: \
    BoxInteractionHandles(
        all=AreaVisuals(
            fill_color="white",
            fill_alpha=1.0,
            line_color="black",
            line_alpha=1.0,
            hover_fill_color="lightgray",
            hover_fill_alpha=1.0,
        ),
    )

class BoxAnnotation(Annotation, AreaVisuals):
    ''' Render a shaded rectangular region as an annotation.

    See :ref:`ug_basic_annotations_box_annotations` for information on plotting box annotations.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    left = Coordinate(default=lambda: Node.frame.left, help="""
    The x-coordinates of the left edge of the box annotation.
    """).accepts(Null, lambda _: Node.frame.left)

    right = Coordinate(default=lambda: Node.frame.right, help="""
    The x-coordinates of the right edge of the box annotation.
    """).accepts(Null, lambda _: Node.frame.right)

    top = Coordinate(default=lambda: Node.frame.top, help="""
    The y-coordinates of the top edge of the box annotation.
    """).accepts(Null, lambda _: Node.frame.top)

    bottom = Coordinate(default=lambda: Node.frame.bottom, help="""
    The y-coordinates of the bottom edge of the box annotation.
    """).accepts(Null, lambda _: Node.frame.bottom)

    left_units = Enum(CoordinateUnits, default="data", help="""
    The unit type for the left attribute. Interpreted as |data units| by
    default. This doesn't have any effect if ``left`` is a node.
    """)

    right_units = Enum(CoordinateUnits, default="data", help="""
    The unit type for the right attribute. Interpreted as |data units| by
    default. This doesn't have any effect if ``right`` is a node.
    """)

    top_units = Enum(CoordinateUnits, default="data", help="""
    The unit type for the top attribute. Interpreted as |data units| by
    default. This doesn't have any effect if ``top`` is a node.
    """)

    bottom_units = Enum(CoordinateUnits, default="data", help="""
    The unit type for the bottom attribute. Interpreted as |data units| by
    default. This doesn't have any effect if ``bottom`` is a node.
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

    min_width = NonNegative(Float, default=0, help="""
    Allows to set the minimum width of the box.

    .. note::
        This property is experimental and may change at any point.
    """)

    min_height = NonNegative(Float, default=0, help="""
    Allows to set the maximum width of the box.

    .. note::
        This property is experimental and may change at any point.
    """)

    max_width = Positive(Float, default=inf, help="""
    Allows to set the minimum height of the box.

    .. note::
        This property is experimental and may change at any point.
    """)

    max_height = Positive(Float, default=inf, help="""
    Allows to set the maximum height of the box.

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

    resizable = Enum(Resizable, default="all", help="""
    If ``editable`` is set, this property allows to configure which
    combinations of edges are allowed to be moved, thus allows
    restrictions on resizing of the box.

    .. note::
        This property is experimental and may change at any point.
    """)

    movable = Enum(Movable, default="both", help="""
    If ``editable`` is set, this property allows to configure in which
    directions the box can be moved.

    .. note::
        This property is experimental and may change at any point.
    """)

    symmetric = Bool(default=False, help="""
    Indicates whether the box is resizable around its center or its corners.

    .. note::
        This property is experimental and may change at any point.
    """)

    use_handles = Bool(default=False, help="""
    Whether to show interaction (move, resize, etc.) handles.

    If handles aren't used, then the whole annotation, its borders and corners
    act as if they were interaction handles.

    .. note::
        This property is experimental and may change at any point.
    """)

    handles = Instance(BoxInteractionHandles, default=DEFAULT_BOX_ANNOTATION_HANDLES, help="""
    Configure appearance of interaction handles.

    Handles can be configured in bulk in an increasing level of specificity,
    were each level, if defined, overrides the more generic setting:

    - `all`     -> `move`, `resize`
    - `resize`  -> `sides`, `corners`
    - `sides`   -> `left`, `right`, `top`, `bottom`
    - `corners` -> `top_left`, `top_right`, `bottom_left`, `bottom_right`

    .. note::
        This property is experimental and may change at any point.
    """).accepts(Instance(AreaVisuals), lambda obj: BoxInteractionHandles(all=obj))

    inverted = Bool(default=False, help="""
    Inverts the geometry of the box, i.e. applies fill and hatch visuals
    to the outside of the box instead of the inside. Visuals are applied
    between the box and its parent, e.g. the frame.
    """)

    line_color = Override(default="#cccccc")
    line_alpha = Override(default=0.3)

    fill_color = Override(default="#fff9ba")
    fill_alpha = Override(default=0.4)

    hover_line_color = Override(default=None)
    hover_line_alpha = Override(default=0.3)

    hover_fill_color = Override(default=None)
    hover_fill_alpha = Override(default=0.4)

    @property
    def nodes(self) -> BoxNodes:
        return BoxNodes(self)

class Band(DataAnnotation):
    ''' Render a filled area band along a dimension.

    See :ref:`ug_basic_annotations_bands` for information on plotting bands.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
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

    hatch_props = Include(ScalarHatchProps, help="""
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
    def __init__(self, *args: Any, **kwargs: Any) -> None:
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
    def __init__(self, *args: Any, **kwargs: Any) -> None:
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
    def __init__(self, *args: Any, **kwargs: Any) -> None:
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
    def __init__(self, *args: Any, **kwargs: Any) -> None:
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
