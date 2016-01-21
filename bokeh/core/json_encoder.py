''' Provide a custom JSON encoder for serializing Bokeh models.

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

import calendar
import datetime as dt
import decimal
import json

import numpy as np

from ..util.dependencies import import_optional
from ..util.serialization import transform_series, transform_array

pd = import_optional('pandas')
rd = import_optional("dateutil.relativedelta")

class BokehJSONEncoder(json.JSONEncoder):
    ''' Encode values to be used in Bokeh documents or communicated to
    a Bokeh server.

    '''
    def transform_python_types(self, obj):
        ''' Handle special scalars, use default json encoder otherwise

        '''
        # Pandas Timestamp
        if pd and isinstance(obj, pd.tslib.Timestamp):
            return obj.value / 10**6.0  #nanosecond to millisecond
        elif np.issubdtype(type(obj), np.float):
            return float(obj)
        elif np.issubdtype(type(obj), np.int):
            return int(obj)
        elif np.issubdtype(type(obj), np.bool_):
            return bool(obj)
        # Datetime
        # datetime is a subclass of date.
        elif isinstance(obj, dt.datetime):
            return calendar.timegm(obj.timetuple()) * 1000. + obj.microsecond / 1000.
        # Date
        elif isinstance(obj, dt.date):
            return calendar.timegm(obj.timetuple()) * 1000.
        # Numpy datetime64
        elif isinstance(obj, np.datetime64):
            epoch_delta = obj - np.datetime64('1970-01-01T00:00:00Z')
            return (epoch_delta / np.timedelta64(1, 'ms'))
        # Time
        elif isinstance(obj, dt.time):
            return (obj.hour * 3600 + obj.minute * 60 + obj.second) * 1000 + obj.microsecond / 1000.
        elif rd and isinstance(obj, rd.relativedelta):
            return dict(years=obj.years, months=obj.months, days=obj.days, hours=obj.hours,
                minutes=obj.minutes, seconds=obj.seconds, microseconds=obj.microseconds)
        # Decimal
        elif isinstance(obj, decimal.Decimal):
            return float(obj)
        else:
            return super(BokehJSONEncoder, self).default(obj)

    def default(self, obj):
        #argh! local import!
        from ..model import Model
        from ..colors import Color
        from .properties import HasProps
        ## array types
        if pd and isinstance(obj, (pd.Series, pd.Index)):
            return transform_series(obj)
        elif isinstance(obj, np.ndarray):
            return transform_array(obj)
        elif isinstance(obj, Model):
            return obj.ref
        elif isinstance(obj, HasProps):
            return obj.properties_with_values(include_defaults=False)
        elif isinstance(obj, Color):
            return obj.to_css()
        else:
            return self.transform_python_types(obj)

def serialize_json(obj, encoder=BokehJSONEncoder, **kwargs):
    ''' Return a serialized JSON representation of a Bokeh model.

    '''
    return json.dumps(obj, cls=encoder, allow_nan=False, **kwargs)
