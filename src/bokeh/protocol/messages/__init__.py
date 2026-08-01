#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''Construct and apply the messages used by the Bokeh server protocol.'''

from __future__ import annotations

from typing import TYPE_CHECKING, TypedDict

from bokeh import __version__

from ...core.serialization import Serialized, Serializer
from ...document.callbacks import invoke_with_curdoc
from ...document.json import PatchJson
from ..exceptions import ProtocolError
from ..message import Empty, Message

if TYPE_CHECKING:
    from ...core.has_props import Setter
    from ...core.types import ID
    from ...document.document import DocJson, Document
    from ...document.events import DocumentPatchedEvent

__all__ = (
    'Ack',
    'Error',
    'ErrorMessage',
    'Ok',
    'PatchDoc',
    'PullDoc',
    'PullDocReply',
    'PullDocReq',
    'PushDoc',
    'PushDocMessage',
    'ServerInfo',
    'ServerInfoReply',
    'ServerInfoReq',
    'VersionInfo',
    'ack',
    'apply_patch',
    'error',
    'ok',
    'patch_doc',
    'pull_doc_reply',
    'pull_doc_req',
    'push_doc',
    'replace_document',
    'server_info_reply',
    'server_info_req',
)

class Error(TypedDict):
    text: str
    traceback: str | None

class PullDoc(TypedDict):
    doc: DocJson

class PushDoc(TypedDict):
    doc: DocJson

class VersionInfo(TypedDict):
    bokeh: str
    server: str

class ServerInfo(TypedDict):
    version_info: VersionInfo

type Ack = Message[Empty]
type ErrorMessage = Message[Error]
type Ok = Message[Empty]
type PatchDoc = Message[PatchJson]
type PullDocReply = Message[PullDoc]
type PullDocReq = Message[Empty]
type PushDocMessage = Message[PushDoc]
type ServerInfoReply = Message[ServerInfo]
type ServerInfoReq = Message[Empty]

_VERSION_INFO = VersionInfo(bokeh=__version__, server=__version__)

def ack() -> Ack:
    return Message(Message.create_header("ACK"), Empty())

def error(request_id: ID, text: str, *, traceback: str | None = None) -> ErrorMessage:
    content = Error(text=text, traceback=traceback)
    return Message(Message.create_header("ERROR", request_id), content)

def ok(request_id: ID) -> Ok:
    return Message(Message.create_header("OK", request_id), Empty())

def patch_doc(events: list[DocumentPatchedEvent]) -> PatchDoc:
    if not events:
        raise ValueError("PATCH-DOC message requires at least one event")

    docs = {event.document for event in events}
    if len(docs) != 1:
        raise ValueError("PATCH-DOC message configured with events for more than one document")

    [doc] = docs
    serializer = Serializer(references=doc.models.synced_references)
    content = PatchJson(events=serializer.encode(events))
    doc.models.flush_synced(lambda model: not serializer.has_ref(model))
    return Message(Message.create_header("PATCH-DOC"), content, serializer.buffers)

def apply_patch(message: PatchDoc, document: Document, setter: Setter | None = None) -> None:
    invoke_with_curdoc(document, lambda: document.apply_json_patch(message.payload, setter=setter))

def pull_doc_reply(request_id: ID, document: Document) -> PullDocReply:
    serialized = document.to_json()
    content = PullDoc(doc=serialized.content)
    return Message(Message.create_header("PULL-DOC-REPLY", request_id), content, serialized.buffers)

def pull_doc_req() -> PullDocReq:
    return Message(Message.create_header("PULL-DOC-REQ"), Empty())

def push_doc(document: Document) -> PushDocMessage:
    serialized = document.to_json()
    content = PushDoc(doc=serialized.content)
    return Message(Message.create_header("PUSH-DOC"), content, serialized.buffers)

def replace_document(message: PullDocReply | PushDocMessage, document: Document) -> None:
    if "doc" not in message.content:
        raise ProtocolError(f"No doc in {message.msgtype}")
    document.replace_with_json(Serialized(message.content["doc"], message.buffers))

def server_info_reply(request_id: ID) -> ServerInfoReply:
    content = ServerInfo(version_info=_VERSION_INFO)
    return Message(Message.create_header("SERVER-INFO-REPLY", request_id), content)

def server_info_req() -> ServerInfoReq:
    return Message(Message.create_header("SERVER-INFO-REQ"), Empty())
