#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Assemble WebSocket wire message fragments into complete Bokeh Server
message objects that can be processed.

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
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Union,
    cast,
)

# Bokeh imports
from .exceptions import ValidationError
from .message import BufferHeader, Message

if TYPE_CHECKING:
    from typing_extensions import TypeAlias

    from . import Protocol

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Receiver',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

Fragment: TypeAlias = Union[str, bytes]

class Receiver:
    ''' Receive wire message fragments and assemble complete Bokeh server
    message objects.

    On ``MessageError`` or ``ValidationError``, the receiver will reset its
    state and attempt to consume a new message.

    The *fragment* received can be either bytes or unicode, depending on
    the transport's semantics (WebSocket allows both).

    .. code-block:: python

        [
            # these are required
            b'{header}',        # serialized header dict
            b'{metadata}',      # serialized metadata dict
            b'{content},        # serialized content dict

            # these are optional, and come in pairs; header contains num_buffers
            b'{buf_header}',    # serialized buffer header dict
            b'array'            # raw buffer payload data
            ...
        ]

    The ``header`` fragment will have the form:

    .. code-block:: python

        header = {
            # these are required
            'msgid'       : <str> # a unique id for the message
            'msgtype'     : <str> # a message type, e.g. 'ACK', 'PATCH-DOC', etc

            # these are optional
            'num_buffers' : <int> # the number of additional buffers, if any
        }

    The ``metadata`` fragment may contain any arbitrary information. It is not
    processed by Bokeh for any purpose, but may be useful for external
    monitoring or instrumentation tools.

    The ``content`` fragment is defined by the specific message type.

    '''

    _current_consumer: Callable[[Fragment], None]
    _fragments: list[Fragment]
    _message: Message[Any] | None
    _buf_header: BufferHeader | None
    _partial: Message[Any] | None

    def __init__(self, protocol: Protocol) -> None:
        ''' Configure a Receiver with a specific Bokeh protocol.

        Args:
            protocol (Protocol) :
                A Bokeh protocol object to use to assemble collected message
                fragments.
        '''
        self._protocol = protocol
        self._current_consumer = self._HEADER
        self._message = None
        self._partial = None
        self._buf_header = None

    async def consume(self, fragment: Fragment) -> Message[Any]|None:
        ''' Consume individual protocol message fragments.

        Args:
            fragment (``JSON``) :
                A message fragment to assemble. When a complete message is
                assembled, the receiver state will reset to begin consuming a
                new message.

        '''
        self._current_consumer(fragment)
        return self._message

    def _HEADER(self, fragment: Fragment) -> None:
        self._message = None
        self._partial = None
        self._fragments = [self._assume_text(fragment)]
        self._current_consumer = self._METADATA

    def _METADATA(self, fragment: Fragment) -> None:
        metadata = self._assume_text(fragment)
        self._fragments.append(metadata)
        self._current_consumer = self._CONTENT

    def _CONTENT(self, fragment: Fragment) -> None:
        content = self._assume_text(fragment)
        self._fragments.append(content)

        header_json, metadata_json, content_json = (self._assume_text(x) for x in self._fragments[:3])

        self._partial = self._protocol.assemble(header_json, metadata_json, content_json)

        self._check_complete()

    def _BUFFER_HEADER(self, fragment: Fragment) -> None:
        header = json.loads(self._assume_text(fragment))
        if set(header) != { "id" }:
            raise ValidationError(f"Malformed buffer header {header!r}")
        self._buf_header = header
        self._current_consumer = self._BUFFER_PAYLOAD

    def _BUFFER_PAYLOAD(self, fragment: Fragment) -> None:
        payload = self._assume_binary(fragment)
        if self._buf_header is None:
            raise ValidationError("Consuming a buffer payload, but current buffer header is None")
        header = BufferHeader(id=self._buf_header["id"])
        cast(Message[Any], self._partial).assemble_buffer(header, payload)

        self._check_complete()

    def _check_complete(self) -> None:
        if self._partial and self._partial.complete:
            self._message = self._partial
            self._current_consumer = self._HEADER
        else:
            self._current_consumer = self._BUFFER_HEADER

    def _assume_text(self, fragment: Fragment) -> str:
        if not isinstance(fragment, str):
            raise ValidationError(f"expected text fragment but received binary fragment for {self._current_consumer.__name__}")
        return fragment

    def _assume_binary(self, fragment: Fragment) -> bytes:
        if not isinstance(fragment, bytes):
            raise ValidationError(f"expected binary fragment but received text fragment for {self._current_consumer.__name__}")
        return fragment

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
