#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Literal, Unpack

# Bokeh imports
from .._types import Datetime, TextLike
from ..core.enums import (
    AlignType as Align,
    AutoType as Auto,
    LabelOrientationType as LabelOrientation,
)
from ..core.property_mixins import (
    ScalarAxisLabelTextProps as AxisLabelText,
    ScalarAxisLabelTextPropsInit as AxisLabelTextInit,
    ScalarAxisLineProps as AxisLine,
    ScalarAxisLinePropsInit as AxisLineInit,
    ScalarBackgroundFillProps as BackgroundFill,
    ScalarBackgroundFillPropsInit as BackgroundFillInit,
    ScalarBackgroundHatchProps as BackgroundHatch,
    ScalarBackgroundHatchPropsInit as BackgroundHatchInit,
    ScalarGroupTextProps as GroupText,
    ScalarGroupTextPropsInit as GroupTextInit,
    ScalarMajorLabelTextProps as MajorLabelText,
    ScalarMajorLabelTextPropsInit as MajorLabelTextInit,
    ScalarMajorTickLineProps as MajorTickLine,
    ScalarMajorTickLinePropsInit as MajorTickLineInit,
    ScalarMinorTickLineProps as MinorTickLine,
    ScalarMinorTickLinePropsInit as MinorTickLineInit,
    ScalarSeparatorLineProps as SeparatorLine,
    ScalarSeparatorLinePropsInit as SeparatorLineInit,
    ScalarSubgroupTextProps as SubgroupText,
    ScalarSubgroupTextPropsInit as SubgroupTextInit,
)
from .formatters import (
    BasicTickFormatter,
    CategoricalTickFormatter,
    DatetimeTickFormatter,
    LogTickFormatter,
    MercatorTickFormatter,
    TickFormatter,
    TimedeltaTickFormatter,
)
from .labeling import LabelingPolicy
from .ranges import Factor
from .renderers import GuideRenderer, GuideRendererInit
from .tickers import (
    BasicTicker,
    CategoricalTicker,
    DatetimeTicker,
    LogTicker,
    MercatorTicker,
    Ticker,
    TimedeltaTicker,
)

class AxisInit(GuideRendererInit, AxisLabelTextInit, MajorLabelTextInit, AxisLineInit, MajorTickLineInit,
        MinorTickLineInit, BackgroundFillInit, BackgroundHatchInit, total=False):
    dimension: Auto | Literal[0, 1]
    face: Auto | Literal["front", "back"]
    bounds: Auto | tuple[float, float] | tuple[Datetime, Datetime]
    ticker: Ticker
    formatter: TickFormatter
    axis_label: TextLike | None
    axis_label_standoff: int
    axis_label_orientation: LabelOrientation | float
    axis_label_align: Align
    major_label_standoff: int
    major_label_orientation: LabelOrientation | float
    major_label_overrides: dict[float | str, TextLike]
    major_label_policy: LabelingPolicy
    major_tick_in: int
    major_tick_out: int
    minor_tick_in: int
    minor_tick_out: int
    fixed_location: None | float | Factor

class Axis(GuideRenderer, AxisLabelText, MajorLabelText, AxisLine, MajorTickLine, MinorTickLine, BackgroundFill, BackgroundHatch):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[AxisInit]) -> None: ...

    dimension: Auto | Literal[0, 1] = ...
    face: Auto | Literal["front", "back"] = ...
    bounds: Auto | tuple[float, float] | tuple[Datetime, Datetime] = ...
    ticker: Ticker = ...
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

class ContinuousAxisInit(AxisInit, total=False):
    ...

class ContinuousAxis(Axis):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ContinuousAxisInit]) -> None: ...

class LinearAxisInit(ContinuousAxisInit, total=False):
    ticker: BasicTicker
    formatter: BasicTickFormatter

class LinearAxis(ContinuousAxis):
    def __init__(self, **kwargs: Unpack[LinearAxisInit]) -> None: ...

    ticker: BasicTicker = ...
    formatter: BasicTickFormatter = ...

class LogAxisInit(ContinuousAxisInit, total=False):
    ticker: LogTicker
    formatter: LogTickFormatter

class LogAxis(ContinuousAxis):
    def __init__(self, **kwargs: Unpack[LogAxisInit]) -> None: ...

    ticker: LogTicker = ...
    formatter: LogTickFormatter = ...

class CategoricalAxisInit(AxisInit, SeparatorLineInit, GroupTextInit, SubgroupTextInit, total=False):
    ticker: CategoricalTicker
    formatter: CategoricalTickFormatter
    group_label_orientation: LabelOrientation | float
    subgroup_label_orientation: LabelOrientation | float

class CategoricalAxis(Axis, SeparatorLine, GroupText, SubgroupText):
    def __init__(self, **kwargs: Unpack[CategoricalAxisInit]) -> None: ...

    ticker: CategoricalTicker = ...
    formatter: CategoricalTickFormatter = ...
    group_label_orientation: LabelOrientation | float = ...
    subgroup_label_orientation: LabelOrientation | float = ...

class DatetimeAxisInit(LinearAxisInit, total=False):
    ticker: DatetimeTicker
    formatter: DatetimeTickFormatter

class DatetimeAxis(LinearAxis):
    def __init__(self, **kwargs: Unpack[DatetimeAxisInit]) -> None: ...

    ticker: DatetimeTicker = ...
    formatter: DatetimeTickFormatter = ...

class MercatorAxisInit(LinearAxisInit, total=False):
    ticker: MercatorTicker
    formatter: MercatorTickFormatter

class MercatorAxis(LinearAxis):
    def __init__(self, **kwargs: Unpack[MercatorAxisInit]) -> None: ...

    ticker: MercatorTicker = ...
    formatter: MercatorTickFormatter = ...

class TimedeltaAxisInit(LinearAxisInit, total=False):
    ticker: TimedeltaTicker
    formatter: TimedeltaTickFormatter

class TimedeltaAxis(LinearAxis):
    def __init__(self, **kwargs: Unpack[TimedeltaAxisInit]) -> None: ...

    ticker: TimedeltaTicker = ...
    formatter: TimedeltaTickFormatter = ...
