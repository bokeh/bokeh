#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a base class for all Bokeh Server Protocol message types.

Boker messages are comprised of a sequence of JSON fragments. Specified as
Python JSON-like data, messages have the general form:

.. code-block:: python

    [
        # these are required
        b'{header}',        # serialized header dict
        b'{metadata}',      # serialized metadata dict
        b'{content}',       # serialized content dict

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
    Any,
    ClassVar,
    NotRequired,
    TypedDict,
    cast,
)

# Bokeh imports
import bokeh.util.serialization as bkserial

# Bokeh imports
from ..core.json_encoder import serialize_json
from ..core.serialization import Buffer, Serialized
from ..core.types import ID
from .exceptions import MessageError, ProtocolError

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Message',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Header(TypedDict):
    msgid: ID
    msgtype: str
    reqid: NotRequired[ID]
    num_buffers: NotRequired[int]

class BufferHeader(TypedDict):
    id: ID

type Metadata = dict[str, Any]

type BufferRef = tuple[BufferHeader, bytes]

class Empty(TypedDict):
    pass

class Message[Content]:
    ''' The Message base class encapsulates creating, assembling, and
    validating the integrity of Bokeh Server messages. Additionally, it
    provide hooks

    '''

    msgtype: ClassVar[str]

    _header: Header
    _content: Content
    _metadata: Metadata
    _buffers: list[Buffer]

    def __init__(self, header: Header, metadata: Metadata, content: Content) -> None:
        ''' Initialize a new message from header, metadata, and content
        dictionaries.

        To assemble a message from existing JSON fragments, use the
        ``assemble`` method.

        To create new messages with automatically generated headers,
        use subclass ``create`` methods.

        Args:
            header (JSON-like) :

            metadata (JSON-like) :

            content (JSON-like) :

        '''
        self._header = header
        self._metadata = metadata
        self._content = content
        self._buffers = []

    def __repr__(self) -> str:
        return f"Message({self.msgtype!r}, msgid={self.header.get('msgid')!r})"

    @classmethod
    def assemble(cls, header_json: str, metadata_json: str, content_json: str) -> Message[Content]:
        ''' Creates a new message, assembled from JSON fragments.

        Args:
            header_json (``JSON``) :

            metadata_json (``JSON``) :

            content_json (``JSON``) :

        Returns:
            Message subclass

        Raises:
            MessageError

        '''

        def decode(name: str, value: str) -> dict[str, Any]:
            try:
                decoded = json.loads(value)
            except (TypeError, ValueError) as error:
                raise MessageError(f"{name} could not be decoded") from error
            if not isinstance(decoded, dict):
                raise MessageError(f"{name} must be a JSON object")
            return decoded

        header = decode("header", header_json)
        metadata = decode("metadata", metadata_json)
        content = decode("content", content_json)

        if header.get("msgtype") != cls.msgtype:
            raise MessageError(f"header msgtype does not match {cls.msgtype!r}")
        msgid = header.get("msgid")
        if not isinstance(msgid, str) or not msgid:
            raise MessageError("header msgid must be a non-empty string")
        reqid = header.get("reqid")
        if reqid is not None and not isinstance(reqid, str):
            raise MessageError("header reqid must be a string")
        num_buffers = header.get("num_buffers", 0)
        if isinstance(num_buffers, bool) or not isinstance(num_buffers, int) or num_buffers < 0:
            raise MessageError("header num_buffers must be a non-negative integer")

        return cls(cast(Header, header), metadata, cast(Content, content))

    def add_buffers(self, *buffers: Buffer) -> None:
        if not buffers:
            return

        ids = {buffer.id for buffer in self._buffers}
        for buffer in buffers:
            if buffer.id in ids:
                raise ProtocolError(f"duplicate buffer id {buffer.id!r}")
            ids.add(buffer.id)

        if "num_buffers" in self._header:
            self._header["num_buffers"] += len(buffers)
        else:
            self._header["num_buffers"] = len(buffers)

        self._buffers.extend(buffers)

    def assemble_buffer(self, buf_header: BufferHeader, buf_payload: bytes) -> None:
        ''' Add a buffer header and payload that we read from the socket.

        This differs from add_buffer() because we're validating vs.
        the header's num_buffers, instead of filling in the header.

        Args:
            buf_header (``JSON``) : a buffer header
            buf_payload (``JSON`` or bytes) : a buffer payload

        Returns:
            None

        Raises:
            ProtocolError
        '''
        num_buffers = self.header.get("num_buffers", 0)
        if num_buffers <= len(self._buffers):
            raise ProtocolError(f"too many buffers received expecting {num_buffers}")
        if any(buffer.id == buf_header["id"] for buffer in self._buffers):
            raise ProtocolError(f"duplicate buffer id {buf_header['id']!r}")
        self._buffers.append(Buffer(buf_header["id"], buf_payload))

    @classmethod
    def create_header(cls, request_id: ID | None = None) -> Header:
        ''' Return a message header fragment dict.

        Args:
            request_id (str or None) :
                Message ID of the message this message replies to

        Returns:
            dict : a message header

        '''
        header = Header(
            msgid   = bkserial.make_id(),
            msgtype = cls.msgtype,
        )
        if request_id is not None:
            header['reqid'] = request_id
        return header

    def fragments(self) -> list[tuple[str | bytes, bool]]:
        '''Return the ordered text and binary WebSocket fragments for this message.'''
        fragments: list[tuple[str | bytes, bool]] = [
            (self.header_json, False),
            (self.metadata_json, False),
            (self.content_json, False),
        ]
        for buffer in self._buffers:
            fragments.append((json.dumps(buffer.ref), False))
            fragments.append((buffer.to_bytes(), True))
        return fragments

    def prepare(self) -> None:
        ''' Eagerly serialize all message fragments and freeze binary buffers. '''
        self._buffers = [Buffer(buffer.id, buffer.to_bytes()) for buffer in self._buffers]
        self._header_json = json.dumps(self.header)
        self._metadata_json = json.dumps(self.metadata)
        self._content_json = serialize_json(self.payload)

    @property
    def complete(self) -> bool:
        ''' Returns whether all required parts of a message are present.

        Returns:
            bool : True if the message is complete, False otherwise

        '''
        return self.header.get('num_buffers', 0) == len(self._buffers)

    @property
    def payload(self) -> Serialized[Content]:
        return Serialized(self.content, self.buffers)

    # header fragment properties

    @property
    def header(self) -> Header:
        return self._header

    @property
    def header_json(self) -> str:
        return json.dumps(self.header)

    # content fragment properties

    @property
    def content(self) -> Content:
        return self._content

    @property
    def content_json(self) -> str:
        return serialize_json(self.payload)

    # metadata fragment properties

    @property
    def metadata(self) -> Metadata:
        return self._metadata

    @property
    def metadata_json(self) -> str:
        return json.dumps(self.metadata)

    # buffer properties

    @property
    def buffers(self) -> list[Buffer]:
        return list(self._buffers)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
