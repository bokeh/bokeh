#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Literal

# Bokeh imports
from ..._types import (
    Date,
    Datetime,
    Positive,
    Time,
)
from ...core.enums import CalendarPositionType as CalendarPosition
from ...core.has_props import HasProps, abstract
from .inputs import InputWidget

@abstract
@dataclass(init=False)
class PickerBase(InputWidget):

    position: CalendarPosition = ...

    inline: bool = ...

@abstract
@dataclass(init=False)
class TimeCommon(HasProps):

    hour_increment: Positive[int] = ...

    minute_increment: Positive[int] = ...

    second_increment: Positive[int] = ...

    seconds: bool = ...

    clock: Literal["12h", "24h"] = ...

@dataclass
class TimePicker(PickerBase, TimeCommon):

    value: Time | None = ...

    time_format: str = ...

    min_time: Time | None = ...

    max_time: Time | None = ...

@abstract
@dataclass(init=False)
class DateCommon(HasProps):

    disabled_dates: list[Date | tuple[Date, Date]] | None = ...

    enabled_dates: list[Date | tuple[Date, Date]] | None = ...

    date_format: str = ...

@abstract
@dataclass(init=False)
class BaseDatePicker(PickerBase, DateCommon):

    min_date: Date | None = ...

    max_date: Date | None = ...

@dataclass
class DatePicker(BaseDatePicker):

    value: Date | None = ...

@dataclass
class DateRangePicker(BaseDatePicker):

    value: tuple[Date, Date] | None = ...

@dataclass
class MultipleDatePicker(BaseDatePicker):

    value: list[Date] = ...

    separator: str = ...

@abstract
@dataclass(init=False)
class BaseDatetimePicker(PickerBase, DateCommon, TimeCommon):

    min_date: Datetime | Date | None = ...

    max_date: Datetime | Date | None = ...

@dataclass
class DatetimePicker(BaseDatetimePicker):

    value: Datetime | None = ...

@dataclass
class DatetimeRangePicker(BaseDatetimePicker):

    value: tuple[Datetime, Datetime] | None = ...

@dataclass
class MultipleDatetimePicker(BaseDatetimePicker):

    value: list[Datetime] = ...

    separator: str = ...
