from __future__ import absolute_import

import json
import logging
import time
import datetime as dt
import calendar

import numpy as np
from six.moves import cPickle as pickle

try:
    import pandas as pd
    is_pandas = True
except ImportError:
    is_pandas = False

try:
    from dateutil.relativedelta import relativedelta
    is_dateutil = True
except ImportError:
    is_dateutil = False

from .settings import settings

log = logging.getLogger(__name__)

millifactor = 10**6.0

class BokehJSONEncoder(json.JSONEncoder):
    def transform_series(self, obj):
        """transform series
        """
        vals = obj.values
        return self.transform_array(vals)

    # Check for astype failures (putative Numpy < 1.7)
    dt2001 = np.datetime64('2001')
    legacy_datetime64 = (dt2001.astype('int64') ==
                         dt2001.astype('datetime64[ms]').astype('int64'))
    def transform_array(self, obj):
        """Transform arrays into lists of json safe types
        also handles pandas series, and replacing
        nans and infs with strings
        """
        ## not quite correct, truncates to ms..
        if obj.dtype.kind == 'M':
            if self.legacy_datetime64:
                if obj.dtype == np.dtype('datetime64[ns]'):
                    return (obj.astype('int64') / millifactor).tolist()
                # else punt.
            else:
                return obj.astype('datetime64[ms]').astype('int64').tolist()
        elif obj.dtype.kind in ('u', 'i', 'f'):
            return self.transform_numerical_array(obj)
        return obj.tolist()

    def transform_numerical_array(self, obj):
        """handles nans/inf conversion
        """
        if isinstance(obj, np.ma.MaskedArray):
            obj = obj.filled(np.nan)  # Set masked values to nan
        if not np.isnan(obj).any() and not np.isinf(obj).any():
            return obj.tolist()
        else:
            transformed = obj.astype('object')
            transformed[np.isnan(obj)] = 'NaN'
            transformed[np.isposinf(obj)] = 'Infinity'
            transformed[np.isneginf(obj)] = '-Infinity'
            return transformed.tolist()

    def transform_python_types(self, obj):
        """handle special scalars, default to default json encoder
        """
        # Pandas Timestamp
        if is_pandas and isinstance(obj, pd.tslib.Timestamp):
            return obj.value / millifactor  #nanosecond to millisecond
        elif np.issubdtype(type(obj), np.float):
            return float(obj)
        elif np.issubdtype(type(obj), np.int):
            return int(obj)
        elif np.issubdtype(type(obj), np.bool_):
            return bool(obj)
        # Datetime, Date
        elif isinstance(obj, (dt.datetime, dt.date)):
            return calendar.timegm(obj.timetuple()) * 1000.
        # Numpy datetime64
        elif isinstance(obj, np.datetime64):
            epoch_delta = obj - np.datetime64('1970-01-01T00:00:00Z')
            return (epoch_delta / np.timedelta64(1, 'ms'))
        # Time
        elif isinstance(obj, dt.time):
            return (obj.hour*3600 + obj.minute*60 + obj.second)*1000 + obj.microsecond / 1000.
        elif is_dateutil and isinstance(obj, relativedelta):
            return dict(years=obj.years, months=obj.months, days=obj.days, hours=obj.hours,
                minutes=obj.minutes, seconds=obj.seconds, microseconds=obj.microseconds)
        else:
            return super(BokehJSONEncoder, self).default(obj)

    def default(self, obj):
        #argh! local import!
        from .plot_object import PlotObject
        from .properties import HasProps
        from .colors import Color
        ## array types
        if is_pandas and isinstance(obj, (pd.Series, pd.Index)):
            return self.transform_series(obj)
        elif isinstance(obj, np.ndarray):
            return self.transform_array(obj)
        elif isinstance(obj, PlotObject):
            return obj.ref
        elif isinstance(obj, HasProps):
            return obj.changed_properties_with_values()
        elif isinstance(obj, Color):
            return obj.to_css()
        else:
            return self.transform_python_types(obj)

def serialize_json(obj, encoder=BokehJSONEncoder, **kwargs):
    if settings.pretty(False):
        kwargs["indent"] = 4
    return json.dumps(obj, cls=encoder, **kwargs)

deserialize_json = json.loads

serialize_web = serialize_json

deserialize_web = deserialize_json

def status_obj(status):
    return {'msgtype': 'status',
            'status': status}

def error_obj(error_msg):
    return {
        'msgtype': 'error',
        'error_msg': error_msg}
