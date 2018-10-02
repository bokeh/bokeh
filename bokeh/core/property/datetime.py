#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide date and time related properties

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import datetime
import dateutil.parser

# External imports
from six import string_types

# Bokeh imports
from ...util.dependencies import import_optional
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

pd = import_optional('pandas')

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Date(Property):
    ''' Accept Date (but not DateTime) values.

    '''
    def __init__(self, default=None, help=None):
        super(Date, self).__init__(default=default, help=help)

    def transform(self, value):
        value = super(Date, self).transform(value)

        if isinstance(value, (float,) + bokeh_integer_types):
            try:
                value = datetime.date.fromtimestamp(value)
            except (ValueError, OSError):
                value = datetime.date.fromtimestamp(value/1000)
        elif isinstance(value, string_types):
            value = dateutil.parser.parse(value).date()

        return value

    def validate(self, value, detail=True):
        super(Date, self).validate(value, detail)

        if not (value is None or isinstance(value, (datetime.date,) + string_types + (float,) + bokeh_integer_types)):
            msg = "" if not detail else "expected a date, string or timestamp, got %r" % value
            raise ValueError(msg)

class Datetime(Property):
    ''' Accept Datetime values.

    '''

    def __init__(self, default=datetime.date.today(), help=None):
        super(Datetime, self).__init__(default=default, help=help)

    def transform(self, value):
        value = super(Datetime, self).transform(value)
        return value
        # Handled by serialization in protocol.py for now

    def validate(self, value, detail=True):
        super(Datetime, self).validate(value, detail)

        datetime_types = (datetime.datetime, datetime.date)
        try:
            import numpy as np
            datetime_types += (np.datetime64,)
        except (ImportError, AttributeError) as e:
            if e.args == ("'module' object has no attribute 'datetime64'",):
                import sys
                if 'PyPy' in sys.version:
                    pass
                else:
                    raise e
            else:
                pass

        if (isinstance(value, datetime_types)):
            return

        if pd and isinstance(value, (pd.Timestamp)):
            return

        msg = "" if not detail else "Expected a datetime instance, got %r" % value
        raise ValueError(msg)

class TimeDelta(Property):
    ''' Accept TimeDelta values.

    '''

    def __init__(self, default=datetime.timedelta(), help=None):
        super(TimeDelta, self).__init__(default=default, help=help)

    def transform(self, value):
        value = super(TimeDelta, self).transform(value)
        return value
        # Handled by serialization in protocol.py for now

    def validate(self, value, detail=True):
        super(TimeDelta, self).validate(value, detail)

        timedelta_types = (datetime.timedelta,)
        try:
            import numpy as np
            timedelta_types += (np.timedelta64,)
        except (ImportError, AttributeError) as e:
            if e.args == ("'module' object has no attribute 'timedelta64'",):
                import sys
                if 'PyPy' in sys.version:
                    pass
                else:
                    raise e
            else:
                pass

        if (isinstance(value, timedelta_types)):
            return

        if pd and isinstance(value, (pd.Timedelta)):
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
