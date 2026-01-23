#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Sequence, Unpack

# Bokeh imports
from ..._specs import CoordinateSpec
from ..._types import (
    Coordinate,
    CoordinateLike,
    NonNegative,
    Positive,
)
from ...core.enums import (
    CoordinateUnitsType as CoordinateUnits,
    DimensionType as Dimension,
    MovableType as Movable,
    ResizableType as Resizable,
)
from ...core.property_aliases import BorderRadius
from ...core.property_mixins import (
    LineProps,
    ScalarAboveFillProps,
    ScalarAboveHatchProps,
    ScalarBelowFillProps,
    ScalarBelowHatchProps,
    ScalarFillProps,
    ScalarHatchProps,
    ScalarHoverFillProps,
    ScalarHoverHatchProps,
    ScalarHoverLineProps,
    ScalarLineProps,
    _LinePropsInit,
    _ScalarAboveFillPropsInit,
    _ScalarAboveHatchPropsInit,
    _ScalarBelowFillPropsInit,
    _ScalarBelowHatchPropsInit,
    _ScalarFillPropsInit,
    _ScalarHatchPropsInit,
    _ScalarHoverFillPropsInit,
    _ScalarHoverHatchPropsInit,
    _ScalarHoverLinePropsInit,
    _ScalarLinePropsInit,
)
from ...model.model import Model, _ModelInit
from ..nodes import BoxNodes
from .annotation import (
    Annotation,
    DataAnnotation,
    _AnnotationInit,
    _DataAnnotationInit,
)
from .arrows import ArrowHead

class _AreaVisualsInit(_ModelInit, _ScalarLinePropsInit, _ScalarFillPropsInit, _ScalarHatchPropsInit,
        _ScalarHoverLinePropsInit, _ScalarHoverFillPropsInit, _ScalarHoverHatchPropsInit, total=False):
    ...

class AreaVisuals(Model, ScalarLineProps, ScalarFillProps, ScalarHatchProps,
        ScalarHoverLineProps, ScalarHoverFillProps, ScalarHoverHatchProps):
    def __init__(self, **kwargs: Unpack[_AreaVisualsInit]) -> None: ...

class _BoxInteractionHandlesInit(_ModelInit, total=False):
    all: AreaVisuals
    move: AreaVisuals | None
    resize: AreaVisuals | None
    sides: AreaVisuals | None
    corners: AreaVisuals | None
    left: AreaVisuals | None
    right: AreaVisuals | None
    top: AreaVisuals | None
    bottom: AreaVisuals | None
    top_left: AreaVisuals | None
    top_right: AreaVisuals | None
    bottom_left: AreaVisuals | None
    bottom_right: AreaVisuals | None

class BoxInteractionHandles(Model):
    def __init__(self, **kwargs: Unpack[_BoxInteractionHandlesInit]) -> None: ...

    all: AreaVisuals = ...
    move: AreaVisuals | None = ...
    resize: AreaVisuals | None = ...
    sides: AreaVisuals | None = ...
    corners: AreaVisuals | None = ...
    left: AreaVisuals | None = ...
    right: AreaVisuals | None = ...
    top: AreaVisuals | None = ...
    bottom: AreaVisuals | None = ...
    top_left: AreaVisuals | None = ...
    top_right: AreaVisuals | None = ...
    bottom_left: AreaVisuals | None = ...
    bottom_right: AreaVisuals | None = ...

class _BoxAnnotationInit(_AnnotationInit, _AreaVisualsInit, total=False):
    left: Coordinate | None
    right: Coordinate | None
    top: Coordinate | None
    bottom: Coordinate | None
    left_units: CoordinateUnits
    right_units: CoordinateUnits
    top_units: CoordinateUnits
    bottom_units: CoordinateUnits
    left_limit: Coordinate | None
    right_limit: Coordinate | None
    top_limit: Coordinate | None
    bottom_limit: Coordinate | None
    min_width: NonNegative[float]
    min_height: NonNegative[float]
    max_width: Positive[float]
    max_height: Positive[float]
    border_radius: BorderRadius
    editable: bool
    resizable: Resizable
    movable: Movable
    symmetric: bool
    use_handles: bool
    handles: BoxInteractionHandles | AreaVisuals
    inverted: bool

class BoxAnnotation(Annotation, AreaVisuals):
    def __init__(self, **kwargs: Unpack[_BoxAnnotationInit]) -> None: ...

    @property
    def left(self) -> Coordinate: ...
    @left.setter
    def left(self, left: Coordinate | None) -> None: ...

    @property
    def right(self) -> Coordinate: ...
    @right.setter
    def right(self, right: Coordinate | None) -> None: ...

    @property
    def top(self) -> Coordinate: ...
    @top.setter
    def top(self, top: Coordinate | None) -> None: ...

    @property
    def bottom(self) -> Coordinate: ...
    @bottom.setter
    def bottom(self, bottom: Coordinate | None) -> None: ...

    left_units: CoordinateUnits = ...
    right_units: CoordinateUnits = ...
    top_units: CoordinateUnits = ...
    bottom_units: CoordinateUnits = ...
    left_limit: Coordinate | None = ...
    right_limit: Coordinate | None = ...
    top_limit: Coordinate | None = ...
    bottom_limit: Coordinate | None = ...
    min_width: NonNegative[float] = ...
    min_height: NonNegative[float] = ...
    max_width: Positive[float] = ...
    max_height: Positive[float] = ...
    border_radius: BorderRadius = ...
    editable: bool = ...
    resizable: Resizable = ...
    movable: Movable = ...
    symmetric: bool = ...
    use_handles: bool = ...

    @property
    def handles(self) -> BoxInteractionHandles: ...
    @handles.setter
    def handles(self, handles: BoxInteractionHandles | AreaVisuals) -> None: ...

    inverted: bool = ...

    @property
    def nodes(self) -> BoxNodes: ...

class _BandInit(_DataAnnotationInit, _ScalarLinePropsInit, _ScalarFillPropsInit, _ScalarHatchPropsInit, total=False):
    lower: CoordinateSpec
    upper: CoordinateSpec
    base: CoordinateSpec
    dimension: Dimension

class Band(DataAnnotation, ScalarLineProps, ScalarFillProps, ScalarHatchProps):
    def __init__(self, **kwargs: Unpack[_BandInit]) -> None: ...

    lower: CoordinateSpec = ...
    upper: CoordinateSpec = ...
    base: CoordinateSpec = ...
    dimension: Dimension = ...

class _PolyAnnotationInit(_AnnotationInit, _ScalarLinePropsInit, _ScalarFillPropsInit, _ScalarHatchPropsInit,
        _ScalarHoverLinePropsInit, _ScalarHoverFillPropsInit, _ScalarHoverHatchPropsInit, total=False):
    xs: Sequence[CoordinateLike]
    xs_units: CoordinateUnits
    ys: Sequence[CoordinateLike]
    ys_units: CoordinateUnits
    editable: bool

class PolyAnnotation(Annotation, ScalarLineProps, ScalarFillProps, ScalarHatchProps,
        ScalarHoverLineProps, ScalarHoverFillProps, ScalarHoverHatchProps):
    def __init__(self, **kwargs: Unpack[_PolyAnnotationInit]) -> None: ...

    xs: Sequence[CoordinateLike] = ...
    xs_units: CoordinateUnits = ...
    ys: Sequence[CoordinateLike] = ...
    ys_units: CoordinateUnits = ...
    editable: bool = ...

class _SlopeInit(_AnnotationInit, _ScalarLinePropsInit, _ScalarAboveFillPropsInit,
        _ScalarAboveHatchPropsInit, _ScalarBelowFillPropsInit, _ScalarBelowHatchPropsInit, total=False):
    gradient: float | None
    y_intercept: float | None

class Slope(Annotation, ScalarLineProps, ScalarAboveFillProps, ScalarAboveHatchProps, ScalarBelowFillProps, ScalarBelowHatchProps):
    def __init__(self, **kwargs: Unpack[_SlopeInit]) -> None: ...

    gradient: float | None = ...
    y_intercept: float | None = ...

class _SpanInit(_AnnotationInit, _ScalarLinePropsInit, _ScalarHoverLinePropsInit, total=False):
    location: CoordinateLike | None
    location_units: CoordinateUnits
    dimension: Dimension
    editable: bool

class Span(Annotation, ScalarLineProps, ScalarHoverLineProps):
    def __init__(self, **kwargs: Unpack[_SpanInit]) -> None: ...

    location: CoordinateLike | None = ...
    location_units: CoordinateUnits = ...
    dimension: Dimension = ...
    editable: bool = ...

class _WhiskerInit(_DataAnnotationInit, _LinePropsInit, total=False):
    lower: CoordinateSpec
    lower_head: ArrowHead | None
    upper: CoordinateSpec
    upper_head: ArrowHead | None
    base: CoordinateSpec
    dimension: Dimension

class Whisker(DataAnnotation, LineProps):
    def __init__(self, **kwargs: Unpack[_WhiskerInit]) -> None: ...

    lower: CoordinateSpec = ...
    lower_head: ArrowHead | None = ...
    upper: CoordinateSpec = ...
    upper_head: ArrowHead | None = ...
    base: CoordinateSpec = ...
    dimension: Dimension = ...
