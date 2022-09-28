#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
    Datetime,
    Either,
    Enum,
    Factor,
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
from ...core.property_mixins import (
    LineProps,
    ScalarFillProps,
    ScalarHatchProps,
    ScalarLineProps,
)
from ...util.serialization import convert_datetime_type
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

    left = Either(Null, Float, Factor, help="""
    The x-coordinates of the left edge of the box annotation.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """)

    left_units = Enum(CoordinateUnits, default='data', help="""
    The unit type for the left attribute. Interpreted as |data units| by
    default.
    """)

    right = Either(Null, Float, Factor, help="""
    The x-coordinates of the right edge of the box annotation.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """)

    right_units = Enum(CoordinateUnits, default='data', help="""
    The unit type for the right attribute. Interpreted as |data units| by
    default.
    """)

    bottom = Either(Null, Float, Factor, help="""
    The y-coordinates of the bottom edge of the box annotation.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """)

    bottom_units = Enum(CoordinateUnits, default='data', help="""
    The unit type for the bottom attribute. Interpreted as |data units| by
    default.
    """)

    top = Either(Null, Float, Factor, help="""
    The y-coordinates of the top edge of the box annotation.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """)

    top_units = Enum(CoordinateUnits, default='data', help="""
    The unit type for the top attribute. Interpreted as |data units| by
    default.
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

    line_alpha = Override(default=0.3)

    line_color = Override(default="#cccccc")

    fill_alpha = Override(default=0.4)

    fill_color = Override(default="#fff9ba")

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

    xs = Seq(Float, default=[], help="""
    The x-coordinates of the region to draw.
    """)

    xs_units = Enum(CoordinateUnits, default='data', help="""
    The unit type for the ``xs`` attribute. Interpreted as |data units| by
    default.
    """)

    ys = Seq(Float, default=[], help="""
    The y-coordinates of the region to draw.
    """)

    ys_units = Enum(CoordinateUnits, default='data', help="""
    The unit type for the ``ys`` attribute. Interpreted as |data units| by
    default.
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

    line_alpha = Override(default=0.3)

    line_color = Override(default="#cccccc")

    fill_alpha = Override(default=0.4)

    fill_color = Override(default="#fff9ba")

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

class Span(Annotation):
    """ Render a horizontal or vertical line span.

    See :ref:`ug_basic_annotations_spans` for information on plotting spans.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    location = Nullable(Float, help="""
    The location of the span, along ``dimension``.

    Datetime values are also accepted, but note that they are immediately
    converted to milliseconds-since-epoch.
    """).accepts(Datetime, convert_datetime_type)

    location_units = Enum(CoordinateUnits, default='data', help="""
    The unit type for the location attribute. Interpreted as "data space"
    units by default.
    """)

    dimension = Enum(Dimension, default='width', help="""
    The direction of the span can be specified by setting this property
    to "height" (``y`` direction) or "width" (``x`` direction).
    """)

    line_props = Include(ScalarLineProps, help="""
    The {prop} values for the span.
    """)

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
