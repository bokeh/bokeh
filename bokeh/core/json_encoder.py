''' Provide a functions and classes to implement a custom JSON encoder for
serializing objects for BokehJS.

The primary interface is provided by the |serialize_json| function, which
uses the custom |BokehJSONEncoder| to produce JSON output.

In general, functions in this module convert values in the following way:

* Datetime values (Python, Pandas, NumPy) are converted to floating point
  milliseconds since epoch.

* TimeDelta values are converted to absolute floating point milliseconds.

* RelativeDelta values are converted to dictionaries.

* Decimal values are converted to floating point.

* Sequences (Pandas Series, NumPy arrays, python sequences) that are passed
  though this interface are converted to lists. Note, however, that arrays in
  data sources inside Bokeh Documents are converted elsewhere, and by default
  use a binary encoded format.

* Bokeh ``Model`` instances are usually serialized elsewhere in the context
  of an entire Bokeh Document. Models passed trough this interface are
  converted to references.

* ``HasProps`` (that are not Bokeh models) are converted to key/value dicts or
  all their properties and values.

* ``Color`` instances are converted to CSS color values.

.. |serialize_json| replace:: :class:`~bokeh.core.json_encoder.serialize_json`
.. |BokehJSONEncoder| replace:: :class:`~bokeh.core.json_encoder.BokehJSONEncoder`

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

import collections
import decimal
import json

import numpy as np

from ..settings import settings
from ..util.dependencies import import_optional
from ..util.serialization import convert_datetime_type, is_datetime_type, transform_series, transform_array

pd = import_optional('pandas')
rd = import_optional("dateutil.relativedelta")

class BokehJSONEncoder(json.JSONEncoder):
    ''' A custom ``json.JSONEncoder`` subclass for encoding objects in
    accordance with the BokehJS protocol.

    '''
    def transform_python_types(self, obj):
        ''' Handle special scalars such as (Python, NumPy, or Pandas)
        datetimes, or Decimal values.

        Args:
            obj (obj) :

                The object to encode. Anything not specifically handled in
                this method is passed on to the default system JSON encoder.

        '''

        # date/time values that get serialized as milliseconds
        if is_datetime_type(obj):
            return convert_datetime_type(obj)

        # slice objects
        elif isinstance(obj, slice):
            return dict(start=obj.start, stop=obj.stop, step=obj.step)

        # NumPy scalars
        elif np.issubdtype(type(obj), np.float):
            return float(obj)
        elif np.issubdtype(type(obj), np.integer):
            return int(obj)
        elif np.issubdtype(type(obj), np.bool_):
            return bool(obj)

        # Decimal values
        elif isinstance(obj, decimal.Decimal):
            return float(obj)

        # RelativeDelta gets serialized as a dict
        elif rd and isinstance(obj, rd.relativedelta):
            return dict(years=obj.years,
                    months=obj.months,
                    days=obj.days,
                    hours=obj.hours,
                    minutes=obj.minutes,
                    seconds=obj.seconds,
                    microseconds=obj.microseconds)

        else:
            return super(BokehJSONEncoder, self).default(obj)

    def default(self, obj):
        ''' The required ``default`` method for JSONEncoder subclasses.

        Args:
            obj (obj) :

                The object to encode. Anything not specifically handled in
                this method is passed on to the default system JSON encoder.

        '''

        from ..model import Model
        from ..colors import Color
        from .has_props import HasProps

        # array types -- use force_list here, only binary
        # encoding CDS columns for now
        if pd and isinstance(obj, (pd.Series, pd.Index)):
            return transform_series(obj, force_list=True)
        elif isinstance(obj, np.ndarray):
            return transform_array(obj, force_list=True)
        elif isinstance(obj, collections.deque):
            return list(map(self.default, obj))
        elif isinstance(obj, Model):
            return obj.ref
        elif isinstance(obj, HasProps):
            return obj.properties_with_values(include_defaults=False)
        elif isinstance(obj, Color):
            return obj.to_css()

        else:
            return self.transform_python_types(obj)

def serialize_json(obj, pretty=False, indent=None, **kwargs):
    ''' Return a serialized JSON representation of objects, suitable to
    send to BokehJS.

    This function is typically used to serialize single python objects in
    the manner expected by BokehJS. In particular, many datetime values are
    automatically normalized to an expected format. Some Bokeh objects can
    also be passed, but note that Bokeh models are typically properly
    serialized in the context of an entire Bokeh document.

    The resulting JSON always has sorted keys. By default. the output is
    as compact as possible unless pretty output or indentation is requested.

    Args:
        obj (obj) : the object to serialize to JSON format

        pretty (bool, optional) :

            Whether to generate prettified output. If ``True``, spaces are
            added after added after separators, and indentation and newlines
            are applied. (default: False)

            Pretty output can also be enabled with the environment variable
            ``BOKEH_PRETTY``, which overrides this argument, if set.

        indent (int or None, optional) :

            Amount of indentation to use in generated JSON output. If ``None``
            then no indentation is used, unless pretty output is enabled,
            in which case two spaces are used. (default: None)

    Any additional keyword arguments are passed to ``json.dumps``, except for
    some that  are computed internally, and cannot be overridden:

    * allow_nan
    * indent
    * separators
    * sort_keys

    Examples:

        .. code-block:: python

            >>> data = dict(b=np.datetime64('2017-01-01'), a = np.arange(3))

            >>>print(serialize_json(data))
            {"a":[0,1,2],"b":1483228800000.0}

            >>> print(serialize_json(data, pretty=True))
            {
              "a": [
                0,
                1,
                2
              ],
              "b": 1483228800000.0
            }

    '''

    # these args to json.dumps are computed internally and should not be passed along
    for name in ['allow_nan', 'separators', 'sort_keys']:
        if name in kwargs:
            raise ValueError("The value of %r is computed internally, overriding is not permissable." % name)

    pretty = settings.pretty(pretty)

    if pretty:
        separators=(",", ": ")
    else:
        separators=(",", ":")

    if pretty and indent is None:
        indent = 2

    return json.dumps(obj, cls=BokehJSONEncoder, allow_nan=False, indent=indent, separators=separators, sort_keys=True, **kwargs)
