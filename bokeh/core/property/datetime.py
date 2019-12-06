#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide date and time related properties

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import datetime

# External imports
import dateutil.parser

# Bokeh imports
from ...util.serialization import (
    convert_date_to_datetime,
    is_datetime_type,
    is_timedelta_type,
)
from .bases import Property
from .primitive import bokeh_integer_types

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Date',
    'Datetime',
    'TimeDelta',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Date(Property):
    ''' Accept Date (but not DateTime) values.

    '''
    def __init__(self, default=None, help=None):
        super().__init__(default=default, help=help)

    def transform(self, value):
        value = super().transform(value)

        if isinstance(value, (float,) + bokeh_integer_types):
            # XXX (bev) hacky: try to convert as ms first, if out of bounds, re-try as seconds
            try:
                value = datetime.date.fromtimestamp(value).isoformat()
            except (ValueError, OSError):
                value = datetime.date.fromtimestamp(value/1000).isoformat()
        elif isinstance(value, str):
            value = dateutil.parser.parse(value).date().isoformat()
        elif isinstance(value, datetime.date):
            value = value.isoformat()

        return value

    def validate(self, value, detail=True):
        super().validate(value, detail)

        if not (value is None or isinstance(value, (datetime.date, str, float,) + bokeh_integer_types)):
            msg = "" if not detail else "expected a date, string or timestamp, got %r" % value
            raise ValueError(msg)

class Datetime(Property):
    ''' Accept Datetime values.

    '''

    def __init__(self, default=datetime.date.today(), help=None):
        super().__init__(default=default, help=help)

    def transform(self, value):
        value = super().transform(value)

        # Handled by serialization in protocol.py for now, except for Date
        if isinstance(value, datetime.date):
            value = convert_date_to_datetime(value)

        return value

    def validate(self, value, detail=True):
        super().validate(value, detail)

        if is_datetime_type(value):
            return

        if isinstance(value, datetime.date):
            return

        msg = "" if not detail else "Expected a datetime value, got %r" % value
        raise ValueError(msg)

class TimeDelta(Property):
    ''' Accept TimeDelta values.

    '''

    def __init__(self, default=datetime.timedelta(), help=None):
        super().__init__(default=default, help=help)

    def transform(self, value):
        value = super().transform(value)
        return value
        # Handled by serialization in protocol.py for now

    def validate(self, value, detail=True):
        super().validate(value, detail)

        if is_timedelta_type(value):
            return

        msg = "" if not detail else "Expected a timedelta instance, got %r" % value
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
