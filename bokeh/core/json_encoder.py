#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a functions and classes to implement a custom JSON encoder for
serializing objects for BokehJS.

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
from json import JSONEncoder
from typing import Any

# Bokeh imports
from ..settings import settings
from .serialization import Buffer, Serialized

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'serialize_json',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def serialize_json(obj: Any | Serialized[Any], *, pretty: bool | None = None, indent: int | None = None) -> str:
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
    pretty = settings.pretty(pretty)

    if pretty:
        separators=(",", ": ")
    else:
        separators=(",", ":")

    if pretty and indent is None:
        indent = 2

    content: Any
    buffers: list[Buffer]
    if isinstance(obj, Serialized):
        content = obj.content
        buffers = obj.buffers or []
    else:
        content = obj
        buffers = []

    encoder = PayloadEncoder(buffers=buffers, indent=indent, separators=separators)
    return encoder.encode(content)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class PayloadEncoder(JSONEncoder):
    def __init__(self, *, buffers: list[Buffer] = [], threshold: int = 100,
            indent: int | None = None, separators: tuple[str, str] | None = None):
        super().__init__(sort_keys=False, allow_nan=False, indent=indent, separators=separators)
        self._buffers = {buf.id: buf for buf in buffers}
        self._threshold = threshold

    def default(self, obj: Any) -> Any:
        if isinstance(obj, Buffer):
            if obj.id in self._buffers: # TODO: and len(obj.data) > self._threshold:
                return obj.ref
            else:
                return obj.to_base64()
        else:
            return super().default(obj)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
