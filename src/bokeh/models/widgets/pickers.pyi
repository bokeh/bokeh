#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Literal, TypedDict, Unpack

# Bokeh imports
from ..._types import (
    Date,
    Datetime,
    Positive,
    Time,
)
from ...core.enums import CalendarPositionType as CalendarPosition
from ...core.has_props import HasProps
from .inputs import InputWidget, _InputWidgetInit

class _PickerBaseInit(_InputWidgetInit, total=False):
    position: CalendarPosition
    inline: bool

class PickerBase(InputWidget):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_PickerBaseInit]) -> None: ...

    position: CalendarPosition = ...
    inline: bool = ...

class _TimeCommonInit(TypedDict, total=False):
    hour_increment: Positive[int]
    minute_increment: Positive[int]
    second_increment: Positive[int]
    seconds: bool
    clock: Literal["12h", "24h"]

class TimeCommon(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_TimeCommonInit]) -> None: ...

    hour_increment: Positive[int] = ...
    minute_increment: Positive[int] = ...
    second_increment: Positive[int] = ...
    seconds: bool = ...
    clock: Literal["12h", "24h"] = ...

class _TimePickerInit(_PickerBaseInit, _TimeCommonInit, total=False):
    value: Time | None
    time_format: str
    min_time: Time | None
    max_time: Time | None

class TimePicker(PickerBase, TimeCommon):
    def __init__(self, **kwargs: Unpack[_TimePickerInit]) -> None: ...

    value: Time | None = ...
    time_format: str = ...
    min_time: Time | None = ...
    max_time: Time | None = ...

class _DateCommonInit(TypedDict, total=False):
    disabled_dates: list[Date | tuple[Date, Date]] | None
    enabled_dates: list[Date | tuple[Date, Date]] | None
    date_format: str

class DateCommon(HasProps):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DateCommonInit]) -> None: ...

    disabled_dates: list[Date | tuple[Date, Date]] | None = ...
    enabled_dates: list[Date | tuple[Date, Date]] | None = ...
    date_format: str = ...

class _BaseDatePickerInit(_PickerBaseInit, _DateCommonInit, total=False):
    min_date: Date | None
    max_date: Date | None

class BaseDatePicker(PickerBase, DateCommon):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_BaseDatePickerInit]) -> None: ...

    min_date: Date | None = ...
    max_date: Date | None = ...

class _DatePickerInit(_BaseDatePickerInit, total=False):
    value: Date | None

class DatePicker(BaseDatePicker):
    def __init__(self, **kwargs: Unpack[_DatePickerInit]) -> None: ...

    value: Date | None = ...

class _DateRangePickerInit(_BaseDatePickerInit, total=False):
    value: tuple[Date, Date] | None

class DateRangePicker(BaseDatePicker):
    def __init__(self, **kwargs: Unpack[_DateRangePickerInit]) -> None: ...

    value: tuple[Date, Date] | None = ...

class _MultipleDatePickerInit(_BaseDatePickerInit, total=False):
    value: list[Date]
    separator: str

class MultipleDatePicker(BaseDatePicker):
    def __init__(self, **kwargs: Unpack[_MultipleDatePickerInit]) -> None: ...

    value: list[Date] = ...
    separator: str = ...

class _BaseDatetimePickerInit(_PickerBaseInit, _DateCommonInit, _TimeCommonInit, total=False):
    min_date: Datetime | Date | None
    max_date: Datetime | Date | None

class BaseDatetimePicker(PickerBase, DateCommon, TimeCommon):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_BaseDatetimePickerInit]) -> None: ...

    min_date: Datetime | Date | None = ...
    max_date: Datetime | Date | None = ...

class _DatetimePickerInit(_BaseDatetimePickerInit, total=False):
    value: Datetime | None

class DatetimePicker(BaseDatetimePicker):
    def __init__(self, **kwargs: Unpack[_DatetimePickerInit]) -> None: ...

    value: Datetime | None = ...

class _DatetimeRangePickerInit(_BaseDatetimePickerInit, total=False):
    value: tuple[Datetime, Datetime] | None

class DatetimeRangePicker(BaseDatetimePicker):
    def __init__(self, **kwargs: Unpack[_DatetimeRangePickerInit]) -> None: ...

    value: tuple[Datetime, Datetime] | None = ...

class _MultipleDatetimePickerInit(_BaseDatetimePickerInit, total=False):
    value: list[Datetime]
    separator: str

class MultipleDatetimePicker(BaseDatetimePicker):
    def __init__(self, **kwargs: Unpack[_MultipleDatetimePickerInit]) -> None: ...

    value: list[Datetime] = ...
    separator: str = ...
