#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from .._types import Datetime, TextLike
from ..core.enums import (
    AlignType as Align,
    AutoType as Auto,
    LabelOrientationType as LabelOrientation,
)
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
    _ScalarAxisLabelTextPropsInit as _AxisLabelTextInit,
    _ScalarAxisLinePropsInit as _AxisLineInit,
    _ScalarBackgroundFillPropsInit as _BackgroundFillInit,
    _ScalarBackgroundHatchPropsInit as _BackgroundHatchInit,
    _ScalarGroupTextPropsInit as _GroupTextInit,
    _ScalarMajorLabelTextPropsInit as _MajorLabelTextInit,
    _ScalarMajorTickLinePropsInit as _MajorTickLineInit,
    _ScalarMinorTickLinePropsInit as _MinorTickLineInit,
    _ScalarSeparatorLinePropsInit as _SeparatorLineInit,
    _ScalarSubgroupTextPropsInit as _SubgroupTextInit,
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
from .renderers.renderer import GuideRenderer, _GuideRendererInit
from .tickers import (
    BasicTicker,
    CategoricalTicker,
    DatetimeTicker,
    LogTicker,
    MercatorTicker,
    Ticker,
    TimedeltaTicker,
)

class _AxisInit(_GuideRendererInit, _AxisLabelTextInit, _MajorLabelTextInit, _AxisLineInit, _MajorTickLineInit,
        _MinorTickLineInit, _BackgroundFillInit, _BackgroundHatchInit, total=False):
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
    def __init__(self, **kwargs: Unpack[_AxisInit]) -> None: ...

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

class _ContinuousAxisInit(_AxisInit, total=False):
    ...

class ContinuousAxis(Axis):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ContinuousAxisInit]) -> None: ...

class _LinearAxisInit(_ContinuousAxisInit, total=False):
    ticker: BasicTicker
    formatter: BasicTickFormatter

class LinearAxis(ContinuousAxis):
    def __init__(self, **kwargs: Unpack[_LinearAxisInit]) -> None: ...

    ticker: BasicTicker = ...
    formatter: BasicTickFormatter = ...

class _LogAxisInit(_ContinuousAxisInit, total=False):
    ticker: LogTicker
    formatter: LogTickFormatter

class LogAxis(ContinuousAxis):
    def __init__(self, **kwargs: Unpack[_LogAxisInit]) -> None: ...

    ticker: LogTicker = ...
    formatter: LogTickFormatter = ...

class _CategoricalAxisInit(_AxisInit, _SeparatorLineInit, _GroupTextInit, _SubgroupTextInit, total=False):
    ticker: CategoricalTicker
    formatter: CategoricalTickFormatter
    group_label_orientation: LabelOrientation | float
    subgroup_label_orientation: LabelOrientation | float

class CategoricalAxis(Axis, SeparatorLine, GroupText, SubgroupText):
    def __init__(self, **kwargs: Unpack[_CategoricalAxisInit]) -> None: ...

    ticker: CategoricalTicker = ...
    formatter: CategoricalTickFormatter = ...
    group_label_orientation: LabelOrientation | float = ...
    subgroup_label_orientation: LabelOrientation | float = ...

class _DatetimeAxisInit(_LinearAxisInit, total=False):
    ticker: DatetimeTicker
    formatter: DatetimeTickFormatter

class DatetimeAxis(LinearAxis):
    def __init__(self, **kwargs: Unpack[_DatetimeAxisInit]) -> None: ...

    ticker: DatetimeTicker = ...
    formatter: DatetimeTickFormatter = ...

class _MercatorAxisInit(_LinearAxisInit, total=False):
    ticker: MercatorTicker
    formatter: MercatorTickFormatter

class MercatorAxis(LinearAxis):
    def __init__(self, **kwargs: Unpack[_MercatorAxisInit]) -> None: ...

    ticker: MercatorTicker = ...
    formatter: MercatorTickFormatter = ...

class _TimedeltaAxisInit(_LinearAxisInit, total=False):
    ticker: TimedeltaTicker
    formatter: TimedeltaTickFormatter

class TimedeltaAxis(LinearAxis):
    def __init__(self, **kwargs: Unpack[_TimedeltaAxisInit]) -> None: ...

    ticker: TimedeltaTicker = ...
    formatter: TimedeltaTickFormatter = ...
