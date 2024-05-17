# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from ..._types import NumberSpec
from ...core.enums import CoordinateUnitsType as CoordinateUnits
from ...core.has_props import abstract
from ...core.property_mixins import FillProps, LineProps
from ..graphics import Marking
from .annotation import DataAnnotation

@abstract
@dataclass(init=False)
class ArrowHead(Marking):

    size: NumberSpec = ...

@dataclass
class OpenHead(ArrowHead):

    line_props: LineProps = ...

@dataclass
class NormalHead(ArrowHead):

    line_props: LineProps = ...

    fill_props: FillProps = ...

@dataclass
class TeeHead(ArrowHead):

    line_props: LineProps = ...

@dataclass
class VeeHead(ArrowHead):

    line_props: LineProps = ...

    fill_props: FillProps = ...

@dataclass
class Arrow(DataAnnotation):

    x_start: NumberSpec = ...

    y_start: NumberSpec = ...

    start_units: CoordinateUnits = ...

    start: ArrowHead | None = ...

    x_end: NumberSpec = ...

    y_end: NumberSpec = ...

    end_units: CoordinateUnits = ...

    end: ArrowHead | None = ...

    body_props: LineProps = ...
