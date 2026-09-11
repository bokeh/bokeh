#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''Represent Bokeh protocol messages independently of their transport.'''

from __future__ import annotations

# Standard library imports
import json
from typing import (
    Any,
    Literal,
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

__all__ = (
    'Message',
    'MessageType',
)

type MessageType = Literal[
    "ACK",
    "ERROR",
    "OK",
    "PATCH-DOC",
    "PULL-DOC-REPLY",
    "PULL-DOC-REQ",
    "PUSH-DOC",
    "SYNC",
]

MESSAGE_TYPES: frozenset[str] = frozenset({
    "ACK",
    "ERROR",
    "OK",
    "PATCH-DOC",
    "PULL-DOC-REPLY",
    "PULL-DOC-REQ",
    "PUSH-DOC",
    "SYNC",
})

MAX_BUFFERS_PER_MESSAGE = 10_000

class Header(TypedDict):
    msgid: ID
    msgtype: MessageType
    reqid: NotRequired[ID]

class Empty(TypedDict):
    pass

class Message[Content]:
    '''A validated message header, content, and optional buffers.'''

    def __init__(self, header: Header, content: Content, buffers: list[Buffer] | None = None) -> None:
        self._header = header
        self._content = content
        self._buffers = list(buffers or [])
        self._envelope_json: str | None = None
        if len(self._buffers) > MAX_BUFFERS_PER_MESSAGE:
            raise ProtocolError(f"message cannot contain more than {MAX_BUFFERS_PER_MESSAGE} buffers")
        if len(self._buffers) != len({buffer.id for buffer in self._buffers}):
            raise ProtocolError("buffer ids must be unique")

    def __repr__(self) -> str:
        description = f"Message({self.msgtype!r}, msgid={self.header.get('msgid')!r})"
        if self.msgtype == "ERROR":
            content = cast(dict[str, Any], self.content)
            description += f" --- {content.get('text', '')}"
            if content.get("traceback") is not None:
                description += "\n" + content["traceback"]
        return description

    @staticmethod
    def decode(envelope_json: str) -> tuple[Header, dict[str, Any], list[ID]]:
        '''Decode and validate a message envelope.'''
        try:
            envelope = json.loads(envelope_json)
        except (TypeError, ValueError) as error:
            raise MessageError("message envelope could not be decoded") from error
        if not isinstance(envelope, dict) or set(envelope) != {"header", "content", "buffers"}:
            raise MessageError("message envelope must contain header, content, and buffers")

        header = envelope["header"]
        content = envelope["content"]
        buffer_ids = envelope["buffers"]
        if not isinstance(header, dict):
            raise MessageError("header must be a JSON object")
        if not isinstance(content, dict):
            raise MessageError("content must be a JSON object")
        if not isinstance(buffer_ids, list) or not all(isinstance(buffer_id, str) and buffer_id for buffer_id in buffer_ids):
            raise MessageError("buffers must be a list of non-empty strings")
        if len(buffer_ids) > MAX_BUFFERS_PER_MESSAGE:
            raise MessageError(f"message cannot contain more than {MAX_BUFFERS_PER_MESSAGE} buffers")
        if len(buffer_ids) != len(set(buffer_ids)):
            raise MessageError("buffer ids must be unique")

        msgtype = header.get("msgtype")
        if not isinstance(msgtype, str) or msgtype not in MESSAGE_TYPES:
            raise ProtocolError(f"Unknown message type {msgtype!r} for Bokeh protocol")
        msgid = header.get("msgid")
        if not isinstance(msgid, str) or not msgid:
            raise MessageError("header msgid must be a non-empty string")
        reqid = header.get("reqid")
        if reqid is not None and not isinstance(reqid, str):
            raise MessageError("header reqid must be a string")
        if not set(header).issubset({"msgid", "msgtype", "reqid"}):
            raise MessageError("header contains unknown fields")
        return cast(Header, header), content, cast(list[ID], buffer_ids)

    @staticmethod
    def create_header(msgtype: MessageType, request_id: ID | None = None) -> Header:
        header = Header(msgid=bkserial.make_id(), msgtype=msgtype)
        if request_id is not None:
            header['reqid'] = request_id
        return header

    def fragments(self) -> list[tuple[str | bytes, bool]]:
        fragments: list[tuple[str | bytes, bool]] = [(self.envelope_json, False)]
        fragments.extend((buffer.to_bytes(), True) for buffer in self._buffers)
        return fragments

    def prepare(self) -> None:
        ''' Eagerly serialize all message fragments and freeze binary buffers. '''
        self._buffers = [Buffer(buffer.id, buffer.to_bytes()) for buffer in self._buffers]
        self._envelope_json = self._serialize_envelope()

    @property
    def payload(self) -> Serialized[Content]:
        return Serialized(self.content, self.buffers)

    @property
    def msgtype(self) -> MessageType:
        return self._header["msgtype"]

    @property
    def header(self) -> Header:
        return self._header

    @property
    def envelope_json(self) -> str:
        return self._envelope_json or self._serialize_envelope()

    def _serialize_envelope(self) -> str:
        return serialize_json({
            "header": self.header,
            "content": self.content,
            "buffers": [buffer.id for buffer in self._buffers],
        })

    @property
    def content(self) -> Content:
        return self._content

    @property
    def buffers(self) -> list[Buffer]:
        return list(self._buffers)
