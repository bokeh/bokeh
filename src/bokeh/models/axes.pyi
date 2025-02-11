#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Literal, Sequence

# Bokeh imports
from .._types import Datetime, TextLike
from ..core.enums import (
    AlignType as Align,
    AutoType as Auto,
    LabelOrientationType as LabelOrientation,
)
from ..core.has_props import abstract
from ..core.property_mixins import (
    ScalarAxisLabelTextProps as AxisLabelText,
    ScalarAxisLineProps as AxisLine,
    ScalarBackgroundFillProps as BackgroundFill,
    ScalarBackgroundHatchProps as BackgroundHatch,
    ScalarGroupTextProps as GroupText,
    ScalarMajorLabelTextProps as MajorLabelText,
    ScalarMajorTickLineProps as MajorTickLine,
    ScalarMinorTickLineProps as MinorTickLine,
    ScalarSeparatorLineProps as SeparatorLine,
    ScalarSubgroupTextProps as SubgroupText,
)
from .formatters import (
    BasicTickFormatter,
    CategoricalTickFormatter,
    DatetimeTickFormatter,
    LogTickFormatter,
    MercatorTickFormatter,
    TickFormatter,
)
from .labeling import LabelingPolicy
from .ranges import Factor
from .renderers import GuideRenderer
from .tickers import (
    BasicTicker,
    CategoricalTicker,
    DatetimeTicker,
    LogTicker,
    MercatorTicker,
    Ticker,
)

@abstract
@dataclass(init=False)
class Axis(GuideRenderer, AxisLabelText, MajorLabelText, AxisLine, MajorTickLine, MinorTickLine, BackgroundFill, BackgroundHatch):

    dimension: Auto | Literal[0, 1] = ...

    face: Auto | Literal["front", "back"] = ...

    bounds: Auto | tuple[float, float] | tuple[Datetime, Datetime] = ...

    ticker: Ticker | Sequence[float] = ...

    formatter: TickFormatter = ...

    axis_label: TextLike | None = ...

    axis_label_standoff: int = ...

    axis_label_orientation: LabelOrientation | float = ...

    axis_label_align: Align = ...

    major_label_standoff: int = ...

    major_label_orientation: LabelOrientation | float = ...

    major_label_overrides: dict[float | str, TextLike] = ...

    major_label_policy: LabelingPolicy = ...

    major_tick_in: int = ...

    major_tick_out: int = ...

    minor_tick_in: int = ...

    minor_tick_out: int = ...

    fixed_location: None | float | Factor = ...

@abstract
@dataclass(init=False)
class ContinuousAxis(Axis):
    ...

@dataclass
class LinearAxis(ContinuousAxis):

    ticker: BasicTicker = ...

    formatter: BasicTickFormatter = ...

@dataclass
class LogAxis(ContinuousAxis):

    ticker: LogTicker = ...

    formatter: LogTickFormatter = ...

@dataclass
class CategoricalAxis(Axis, SeparatorLine, GroupText, SubgroupText):

    ticker: CategoricalTicker = ...

    formatter: CategoricalTickFormatter = ...

    group_label_orientation: LabelOrientation | float = ...

    subgroup_label_orientation: LabelOrientation | float = ...

@dataclass
class DatetimeAxis(LinearAxis):

    ticker: DatetimeTicker = ...

    formatter: DatetimeTickFormatter = ...

@dataclass
class MercatorAxis(LinearAxis):

    ticker: MercatorTicker = ...

    formatter: MercatorTickFormatter = ...
