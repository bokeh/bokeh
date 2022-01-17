#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
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
import json
from typing import Any

# Bokeh imports
from ..settings import settings
from .types import JSON

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'serialize_json',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def serialize_json(obj: JSON, *, pretty: bool | None = None, indent: int | None = None, **kwargs: Any) -> str:
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
            raise ValueError(f"The value of {name!r} is computed internally, overriding is not permissible.")

    pretty = settings.pretty(pretty)

    if pretty:
        separators=(",", ": ")
    else:
        separators=(",", ":")

    if pretty and indent is None:
        indent = 2

    return json.dumps(obj, allow_nan=False, indent=indent, separators=separators, sort_keys=True, **kwargs)


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
