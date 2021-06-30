#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Implement and provide message protocols for communication between Bokeh
Servers and clients.

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
from typing import (
    TYPE_CHECKING,
    Any,
    List,
    overload,
)

# External imports
from tornado.escape import json_decode
from typing_extensions import Literal

# Bokeh imports
from .exceptions import ProtocolError
from .message import Message
from .messages.ack import ack
from .messages.error import error
from .messages.ok import ok
from .messages.patch_doc import patch_doc
from .messages.pull_doc_reply import pull_doc_reply
from .messages.pull_doc_req import pull_doc_req
from .messages.push_doc import push_doc
from .messages.server_info_reply import server_info_reply
from .messages.server_info_req import server_info_req

if TYPE_CHECKING:
    from ..core.types import ID
    from ..document.document import Document
    from ..document.events import DocumentPatchedEvent
    from .receiver import Fragment

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Protocol',
)

SPEC = {
    "ACK": ack,
    "ERROR": error,
    "OK": ok,
    "PATCH-DOC": patch_doc,
    "PULL-DOC-REPLY": pull_doc_reply,
    "PULL-DOC-REQ": pull_doc_req,
    "PUSH-DOC": push_doc,
    "SERVER-INFO-REPLY": server_info_reply,
    "SERVER-INFO-REQ": server_info_req,
}

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

MessageType = Literal[
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

class Protocol:
    ''' Provide a message factory for the Bokeh Server message protocol.

    '''

    def __init__(self) -> None:
        self._messages = SPEC

    def __repr__(self) -> str:
        return "Protocol()"

    @overload
    def create(self, msgtype: Literal["ACK"], **metadata: Any) -> ack: ...
    @overload
    def create(self, msgtype: Literal["ERROR"], request_id: ID, text: str, **metadata: Any) -> error: ...
    @overload
    def create(self, msgtype: Literal["OK"], request_id: ID, **metadata: Any) -> ok: ...
    @overload
    def create(self, msgtype: Literal["PATCH-DOC"], events: List[DocumentPatchedEvent], use_buffers: bool = ..., **metadata: Any) -> patch_doc: ...
    @overload
    def create(self, msgtype: Literal["PULL-DOC-REPLY"], request_id: ID, document: Document, **metadata: Any) -> pull_doc_reply: ...
    @overload
    def create(self, msgtype: Literal["PULL-DOC-REQ"], **metadata: Any) -> pull_doc_req: ...
    @overload
    def create(self, msgtype: Literal["PUSH-DOC"], document: Document, **metadata: Any) -> push_doc: ...
    @overload
    def create(self, msgtype: Literal["SERVER-INFO-REPLY"], request_id: ID, **metadata: Any) -> server_info_reply: ...
    @overload
    def create(self, msgtype: Literal["SERVER-INFO-REQ"], **metadata: Any) -> server_info_req: ...

    def create(self, msgtype: MessageType, *args: Any, **kwargs: Any) -> Message[Any]:
        ''' Create a new Message instance for the given type.

        Args:
            msgtype (str) :

        '''
        if msgtype not in self._messages:
            raise ProtocolError(f"Unknown message type {msgtype!r} for Bokeh protocol")
        return self._messages[msgtype].create(*args, **kwargs)

    def assemble(self, header_json: Fragment, metadata_json: Fragment, content_json: Fragment) -> Message[Any]:
        ''' Create a Message instance assembled from json fragments.

        Args:
            header_json (``JSON``) :

            metadata_json (``JSON``) :

            content_json (``JSON``) :

        Returns:
            message

        '''
        header = json_decode(header_json)
        if 'msgtype' not in header:
            log.error(f"Bad header with no msgtype was: {header!r}")
            raise ProtocolError("No 'msgtype' in header")
        return self._messages[header["msgtype"]].assemble(header_json, metadata_json, content_json)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
