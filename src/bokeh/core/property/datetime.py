#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide date and time related properties

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import datetime
from typing import Any, Union

# Bokeh imports
from ...util.serialization import convert_date_to_datetime, is_datetime_type, is_timedelta_type
from .bases import Init, Property
from .primitive import bokeh_integer_types
from .singletons import Undefined

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Date',
    'Datetime',
    'Time',
    'TimeDelta',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Date(Property[Union[str, datetime.date]]):
    """ Accept ISO format Date (but not DateTime) values.

    """
    def transform(self, value: Any) -> Any:
        value = super().transform(value)

        if isinstance(value, datetime.date):
            value = value.isoformat()

        return value

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        # datetime.datetime is datetime.date, exclude manually up front
        if isinstance(value, datetime.datetime):
            msg = "" if not detail else "Expected a date value, got a datetime.datetime"
            raise ValueError(msg)

        if isinstance(value, datetime.date):
            return

        try:
            datetime.datetime.fromisoformat(value)
        except Exception:
            msg = "" if not detail else f"Expected an ISO date string, got {value!r}"
            raise ValueError(msg)

class Datetime(Property[Union[str, datetime.date, datetime.datetime]]):
    """ Accept ISO format Datetime values.

    """

    def __init__(self, default: Init[str | datetime.date | datetime.datetime] = Undefined, *, help: str | None = None) -> None:
        super().__init__(default=default, help=help)

    def transform(self, value: Any) -> Any:
        value = super().transform(value)

        if isinstance(value, str):
            value = datetime.datetime.fromisoformat(value)

        # Handled by serialization in protocol.py for now, except for Date
        if isinstance(value, datetime.date):
            value = convert_date_to_datetime(value)

        return value

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if is_datetime_type(value):
            return

        if isinstance(value, datetime.date):
            return

        if Datetime.is_timestamp(value):
            return

        if isinstance(value, str):
            try:
                datetime.datetime.fromisoformat(value).date()
                return
            except Exception:
                pass

        msg = "" if not detail else f"Expected a date, datetime object, or timestamp, got {value!r}"
        raise ValueError(msg)

    @staticmethod
    def is_timestamp(value: Any) -> bool:
        return isinstance(value, (float,) + bokeh_integer_types) and not isinstance(value, bool)

class Time(Property[Union[str, datetime.time]]):
    """ Accept ISO format time values.

    """

    def __init__(self, default: Init[str | datetime.time] = Undefined, *, help: str | None = None) -> None:
        super().__init__(default=default, help=help)

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if isinstance(value, datetime.time):
            return

        if isinstance(value, str):
            try:
                datetime.time.fromisoformat(value)
                return
            except ValueError:
                pass

        msg = "" if not detail else f"Expected a time object, or ISO formatted time string, got {value!r}"
        raise ValueError(msg)

    def transform(self, value: Any) -> Any:
        value = super().transform(value)

        if isinstance(value, str):
            value = datetime.time.fromisoformat(value)

        return value

class TimeDelta(Property[datetime.timedelta]):
    """ Accept TimeDelta values.

    """

    def __init__(self, default: Init[datetime.timedelta] = datetime.timedelta(), *, help: str | None = None) -> None:
        super().__init__(default=default, help=help)

    def transform(self, value: Any) -> Any:
        value = super().transform(value)
        return value
        # Handled by serialization in protocol.py for now

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if is_timedelta_type(value):
            return

        msg = "" if not detail else f"Expected a timedelta instance, got {value!r}"
        raise ValueError(msg)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
