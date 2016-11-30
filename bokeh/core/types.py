""" Definitons of bokeh types. """

import six
import numbers
import datetime

from ..util.dependencies import import_optional
np = import_optional('numpy')
pd = import_optional('pandas')

bool_types = (bool,)
if np:
    bool_types += (np.bool8,)

integer_types = (numbers.Integral,)

float_types = (numbers.Real,)

complex_types = (numbers.Complex,)

string_types = six.string_types

date_types = (datetime.date,) + string_types + (float,) + integer_types

datetime_types = (datetime.datetime, datetime.date)
if np:
    datetime_types += (np.datetime64,)
if pd:
    datetime_types += (pd.Timestamp,)

timedelta_types = (datetime.timedelta,)
if np:
    timedelta_types += (np.timedelta64,)
if pd:
    timedelta_types += (pd.Timedelta,)
