#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''Construct and apply the messages used by the Bokeh server protocol.'''

from __future__ import annotations

# Standard library imports
from typing import TYPE_CHECKING, Any, TypedDict

# Bokeh imports
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
    'ack',
    'apply_patch',
    'error',
    'ok',
    'patch_doc',
    'pull_doc_reply',
    'pull_doc_req',
    'push_doc',
    'replace_document',
    'sync',
)

class _Error(TypedDict):
    text: str
    traceback: str | None

class _PullDoc(TypedDict):
    doc: DocJson

class _PushDoc(TypedDict):
    doc: DocJson

def ack() -> Message[Empty]:
    return Message(Message.create_header("ACK"), Empty())

def error(request_id: ID, text: str, *, traceback: str | None = None) -> Message[_Error]:
    content = _Error(text=text, traceback=traceback)
    return Message(Message.create_header("ERROR", request_id), content)

def ok(request_id: ID) -> Message[Empty]:
    return Message(Message.create_header("OK", request_id), Empty())

def patch_doc(events: list[DocumentPatchedEvent]) -> Message[PatchJson]:
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

def apply_patch(message: Message[Any], document: Document, setter: Setter | None = None) -> None:
    invoke_with_curdoc(document, lambda: document.apply_json_patch(message.payload, setter=setter))

def pull_doc_reply(request_id: ID, document: Document) -> Message[_PullDoc]:
    serialized = document.to_json()
    content = _PullDoc(doc=serialized.content)
    return Message(Message.create_header("PULL-DOC-REPLY", request_id), content, serialized.buffers)

def pull_doc_req() -> Message[Empty]:
    return Message(Message.create_header("PULL-DOC-REQ"), Empty())

def push_doc(document: Document) -> Message[_PushDoc]:
    serialized = document.to_json()
    content = _PushDoc(doc=serialized.content)
    return Message(Message.create_header("PUSH-DOC"), content, serialized.buffers)

def replace_document(message: Message[Any], document: Document) -> None:
    if "doc" not in message.content:
        raise ProtocolError(f"No doc in {message.msgtype}")
    document.replace_with_json(Serialized(message.content["doc"], message.buffers))

def sync() -> Message[Empty]:
    return Message(Message.create_header("SYNC"), Empty())
