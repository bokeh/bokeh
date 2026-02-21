#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from datetime import date, datetime
from typing import TYPE_CHECKING, Literal, Sequence

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from ..._types import Color, Datetime
from ..formatters import TickFormatter
from .widget import Widget, _WidgetInit

class _AbstractSliderInit(_WidgetInit, total=False):
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color

class AbstractSlider(Widget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_AbstractSliderInit]) -> None: ...

    orientation: Literal["horizontal", "vertical"] = ...
    title: str | None = ...
    show_value: bool = ...
    direction: Literal["ltr", "rtl"] = ...
    tooltips: bool = ...
    bar_color: Color = ...

class _NumericalSliderInit(_WidgetInit, total=False):
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    format: str | TickFormatter

class NumericalSlider(AbstractSlider):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_NumericalSliderInit]) -> None: ...

    format: str | TickFormatter = ...

class _CategoricalSliderInit(_WidgetInit, total=False):
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    categories: Sequence[str]
    value: str

class CategoricalSlider(AbstractSlider):
    def __init__(self, **kwargs: Unpack[_CategoricalSliderInit]) -> None: ...

    categories: Sequence[str] = ...
    value: str = ...

    @property
    def value_throttled(self) -> str: ...

class _SliderInit(_WidgetInit, total=False):
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    format: str | TickFormatter
    start: float
    end: float
    value: float
    step: float

class Slider(NumericalSlider):
    def __init__(self, **kwargs: Unpack[_SliderInit]) -> None: ...

    start: float = ...
    end: float = ...
    value: float = ...
    step: float = ...

    @property
    def value_throttled(self) -> float: ...

class _RangeSliderInit(_WidgetInit, total=False):
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    format: str | TickFormatter
    value: tuple[float, float]
    start: float
    end: float
    step: float

class RangeSlider(NumericalSlider):
    def __init__(self, **kwargs: Unpack[_RangeSliderInit]) -> None: ...

    value: tuple[float, float] = ...
    start: float = ...
    end: float = ...
    step: float = ...

    @property
    def value_throttled(self) -> tuple[float, float]: ...

class _DateSliderInit(_WidgetInit, total=False):
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    format: str | TickFormatter
    value: Datetime
    start: Datetime
    end: Datetime
    step: int

class DateSlider(NumericalSlider):
    def __init__(self, **kwargs: Unpack[_DateSliderInit]) -> None: ...

    value: Datetime = ...
    start: Datetime = ...
    end: Datetime = ...
    step: int = ...

    @property
    def value_throttled(self) -> Datetime: ...
    @property
    def value_as_datetime(self) -> datetime | None: ...
    @property
    def value_as_date(self) -> date | None: ...

class _DateRangeSliderInit(_WidgetInit, total=False):
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    format: str | TickFormatter
    value: tuple[Datetime, Datetime]
    start: Datetime
    end: Datetime
    step: int

class DateRangeSlider(NumericalSlider):
    def __init__(self, **kwargs: Unpack[_DateRangeSliderInit]) -> None: ...

    value: tuple[Datetime, Datetime] = ...
    start: Datetime = ...
    end: Datetime = ...
    step: int = ...

    @property
    def value_throttled(self) -> tuple[Datetime, Datetime]: ...
    @property
    def value_as_datetime(self) -> tuple[datetime, datetime] | None: ...
    @property
    def value_as_date(self) -> tuple[date, date] | None: ...

class _DatetimeRangeSliderInit(_WidgetInit, total=False):
    orientation: Literal["horizontal", "vertical"]
    title: str | None
    show_value: bool
    direction: Literal["ltr", "rtl"]
    tooltips: bool
    bar_color: Color
    format: str | TickFormatter
    value: tuple[Datetime, Datetime]
    start: Datetime
    end: Datetime
    step: int

class DatetimeRangeSlider(NumericalSlider):
    def __init__(self, **kwargs: Unpack[_DatetimeRangeSliderInit]) -> None: ...

    value: tuple[Datetime, Datetime] = ...
    start: Datetime = ...
    end: Datetime = ...
    step: int = ...

    @property
    def value_throttled(self) -> tuple[Datetime, Datetime]: ...
    @property
    def value_as_datetime(self) -> tuple[datetime, datetime] | None: ...
