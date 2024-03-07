#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
    '''
    Convert an object or a serialized representation to a JSON string.

    This function accepts Python-serializable objects and converts them to
    a JSON string. This function does not perform any advaced serialization,
    in particular it won't serialize Bokeh models or numpy arrays. For that,
    use :class:`bokeh.core.serialization.Serializer` class, which handles
    serialization of all types of objects that may be encountered in Bokeh.

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

    Returns:

        str: RFC-8259 JSON string

    Examples:

        .. code-block:: python

            >>> import numpy as np

            >>> from bokeh.core.serialization import Serializer
            >>> from bokeh.core.json_encoder import serialize_json

            >>> s = Serializer()

            >>> obj = dict(b=np.datetime64("2023-02-25"), a=np.arange(3))
            >>> rep = s.encode(obj)
            >>> rep
            {
                'type': 'map',
                'entries': [
                    ('b', 1677283200000.0),
                    ('a', {
                        'type': 'ndarray',
                        'array': {'type': 'bytes', 'data': Buffer(id='p1000', data=<memory at 0x7fe5300e2d40>)},
                        'shape': [3],
                        'dtype': 'int32',
                        'order': 'little',
                    }),
                ],
            }

            >>> serialize_json(rep)
            '{"type":"map","entries":[["b",1677283200000.0],["a",{"type":"ndarray","array":'
            "{"type":"bytes","data":"AAAAAAEAAAACAAAA"},"shape":[3],"dtype":"int32","order":"little"}]]}'

    .. note::

        Using this function isn't strictly necessary. The serializer can be
        configured to produce output that's fully compatible with ``dumps()``
        from the standard library module ``json``. The main difference between
        this function and ``dumps()`` is handling of memory buffers. Use the
        following setup:

        .. code-block:: python

            >>> s = Serializer(deferred=False)

            >>> import json
            >>> json.dumps(s.encode(obj))

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
