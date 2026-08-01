#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''Represent Bokeh protocol messages independently of their transport.'''

from __future__ import annotations

import json
from typing import Any, Literal, NotRequired, TypedDict, cast

import bokeh.util.serialization as bkserial

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
    "SERVER-INFO-REPLY",
    "SERVER-INFO-REQ",
]

MESSAGE_TYPES: frozenset[str] = frozenset({
    "ACK",
    "ERROR",
    "OK",
    "PATCH-DOC",
    "PULL-DOC-REPLY",
    "PULL-DOC-REQ",
    "PUSH-DOC",
    "SERVER-INFO-REPLY",
    "SERVER-INFO-REQ",
})

class Header(TypedDict):
    msgid: ID
    msgtype: MessageType
    reqid: NotRequired[ID]
    num_buffers: NotRequired[int]

class BufferHeader(TypedDict):
    id: ID

type Metadata = dict[str, Any]

class Empty(TypedDict):
    pass

class Message[Content]:
    '''A validated message header, metadata, content, and optional buffers.'''

    def __init__(self, header: Header, metadata: Metadata, content: Content, buffers: list[Buffer] | None = None) -> None:
        self._header = header
        self._metadata = metadata
        self._content = content
        self._buffers = list(buffers or [])

    def __repr__(self) -> str:
        description = f"Message({self.msgtype!r}, msgid={self.header.get('msgid')!r})"
        if self.msgtype == "ERROR":
            content = cast(dict[str, Any], self.content)
            description += f" --- {content.get('text', '')}"
            if content.get("traceback") is not None:
                description += "\n" + content["traceback"]
        return description

    @staticmethod
    def assemble(header_json: str, metadata_json: str, content_json: str) -> Message[dict[str, Any]]:
        '''Create a message from its JSON wire fragments.'''

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

        msgtype = header.get("msgtype")
        if not isinstance(msgtype, str) or msgtype not in MESSAGE_TYPES:
            raise ProtocolError(f"Unknown message type {msgtype!r} for Bokeh protocol")
        msgid = header.get("msgid")
        if not isinstance(msgid, str) or not msgid:
            raise MessageError("header msgid must be a non-empty string")
        reqid = header.get("reqid")
        if reqid is not None and not isinstance(reqid, str):
            raise MessageError("header reqid must be a string")
        num_buffers = header.get("num_buffers", 0)
        if isinstance(num_buffers, bool) or not isinstance(num_buffers, int) or num_buffers < 0:
            raise MessageError("header num_buffers must be a non-negative integer")

        return Message(cast(Header, header), metadata, content)

    @staticmethod
    def create_header(msgtype: MessageType, request_id: ID | None = None) -> Header:
        header = Header(msgid=bkserial.make_id(), msgtype=msgtype)
        if request_id is not None:
            header['reqid'] = request_id
        return header

    def add_buffers(self, *buffers: Buffer) -> None:
        if not buffers:
            return

        ids = {buffer.id for buffer in self._buffers}
        for buffer in buffers:
            if buffer.id in ids:
                raise ProtocolError(f"duplicate buffer id {buffer.id!r}")
            ids.add(buffer.id)

        self._header["num_buffers"] = self._header.get("num_buffers", 0) + len(buffers)
        self._buffers.extend(buffers)

    def assemble_buffer(self, buf_header: BufferHeader, buf_payload: bytes) -> None:
        num_buffers = self.header.get("num_buffers", 0)
        if num_buffers <= len(self._buffers):
            raise ProtocolError(f"too many buffers received expecting {num_buffers}")
        if any(buffer.id == buf_header["id"] for buffer in self._buffers):
            raise ProtocolError(f"duplicate buffer id {buf_header['id']!r}")
        self._buffers.append(Buffer(buf_header["id"], buf_payload))

    def fragments(self) -> list[tuple[str | bytes, bool]]:
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
        return self.header.get('num_buffers', 0) == len(self._buffers)

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
    def header_json(self) -> str:
        return json.dumps(self.header)

    @property
    def content(self) -> Content:
        return self._content

    @property
    def content_json(self) -> str:
        return serialize_json(self.payload)

    @property
    def metadata(self) -> Metadata:
        return self._metadata

    @property
    def metadata_json(self) -> str:
        return json.dumps(self.metadata)

    @property
    def buffers(self) -> list[Buffer]:
        return list(self._buffers)
