# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..._types import (
    Angle,
    AngleSpec,
    Coordinate,
    NullStringSpec,
    NumberSpec,
    TextLike,
)
from ...core.enums import (
    AngleUnitsType as AngleUnits,
    CoordinateUnitsType as CoordinateUnits,
    DirectionType as Direction,
    TextAlignType as TextAlign,
    VerticalAlignType as VerticalAlign,
)
from ...core.has_props import abstract
from ...core.property_aliases import BorderRadius, Padding, TextAnchor
from ...core.property_mixins import (
    FillProps,
    LineProps,
    ScalarFillProps,
    ScalarHatchProps,
    ScalarLineProps,
    ScalarTextProps,
    TextProps,
)
from .annotation import Annotation, DataAnnotation

@abstract
@dataclass(init=False)
class TextAnnotation(Annotation):

    text: TextLike = ...

    padding: Padding = ...

    border_radius: BorderRadius = ...

    text_props: ScalarTextProps = ...

    background_fill_props: ScalarFillProps = ...

    background_hatch_props: ScalarHatchProps = ...

    border_props: ScalarLineProps = ...

@dataclass
class Label(TextAnnotation):

    anchor: TextAnchor = ...

    x: Coordinate = ...

    y: Coordinate = ...

    x_units: CoordinateUnits = ...

    y_units: CoordinateUnits = ...

    x_offset: float = ...

    y_offset: float = ...

    angle: Angle = ...

    angle_units: AngleUnits = ...

    direction: Direction = ...

    editable: bool = ...

@dataclass
class LabelSet(DataAnnotation):

    x: NumberSpec = ...

    x_units: CoordinateUnits = ...

    y: NumberSpec = ...

    y_units: CoordinateUnits = ...

    text: NullStringSpec = ...

    angle: AngleSpec = ...

    x_offset: NumberSpec = ...

    y_offset: NumberSpec = ...

    text_props: TextProps = ...

    background_props: FillProps = ...

    border_props: LineProps = ...

@dataclass
class Title(TextAnnotation):

    vertical_align: VerticalAlign = ...

    align: TextAlign = ...

    standoff: float = ...
