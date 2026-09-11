#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''Assemble a JSON envelope and its ordered binary payloads into a message.'''

from __future__ import annotations

# Standard library imports
from typing import Any, Callable

# Bokeh imports
from ..core.serialization import Buffer
from ..core.types import ID
from .exceptions import ProtocolError, ValidationError
from .message import Header, Message

__all__ = (
    'Receiver',
)

type Fragment = str | bytes

class Receiver:
    '''Receive one message envelope followed by its declared binary payloads.'''

    _current_consumer: Callable[[Fragment], Message[Any] | None]
    _header: Header | None
    _content: dict[str, Any] | None
    _buffer_ids: list[ID]
    _buffers: list[Buffer]

    def __init__(self) -> None:
        self._reset()

    def _reset(self) -> None:
        self._current_consumer = self._ENVELOPE
        self._header = None
        self._content = None
        self._buffer_ids = []
        self._buffers = []

    def consume(self, fragment: Fragment) -> Message[Any] | None:
        '''Consume an envelope or binary payload and return a completed message.'''
        try:
            return self._current_consumer(fragment)
        except ProtocolError:
            self._reset()
            raise

    def _ENVELOPE(self, fragment: Fragment) -> Message[Any] | None:
        header, content, buffer_ids = Message.decode(self._assume_text(fragment))
        if not buffer_ids:
            return Message(header, content)

        self._header = header
        self._content = content
        self._buffer_ids = buffer_ids
        self._current_consumer = self._BUFFER_PAYLOAD
        return None

    def _BUFFER_PAYLOAD(self, fragment: Fragment) -> Message[Any] | None:
        payload = self._assume_binary(fragment)
        buffer_id = self._buffer_ids[len(self._buffers)]
        self._buffers.append(Buffer(buffer_id, payload))

        if len(self._buffers) != len(self._buffer_ids):
            return None

        if self._header is None or self._content is None:
            raise ValidationError("buffer payload received without a message envelope")
        message = Message(self._header, self._content, self._buffers)
        self._reset()
        return message

    def _assume_text(self, fragment: Fragment) -> str:
        if not isinstance(fragment, str):
            raise ValidationError(f"expected text fragment but received binary fragment for {self._current_consumer.__name__}")
        return fragment

    def _assume_binary(self, fragment: Fragment) -> bytes:
        if not isinstance(fragment, bytes):
            raise ValidationError(f"expected binary fragment but received text fragment for {self._current_consumer.__name__}")
        return fragment
