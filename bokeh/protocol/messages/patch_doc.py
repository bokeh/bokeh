#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

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
from json import loads
from typing import (
    TYPE_CHECKING,
    Any,
    List,
    Set,
    Tuple,
)

# Bokeh imports
from ...core.json_encoder import serialize_json
from ...document.callbacks import invoke_with_curdoc
from ...document.json import PatchJson
from ...document.util import references_json
from ..message import Message

if TYPE_CHECKING:
    from ...core.has_props import Setter
    from ...document.document import Document
    from ...document.events import DocumentPatched, DocumentPatchedEvent
    from ...model import Model
    from ..message import BufferRef

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'patch_doc',
    'process_document_events',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class patch_doc(Message[PatchJson]):
    ''' Define the ``PATCH-DOC`` message for sending Document patch events
    between remote documents.

    The ``content`` fragment of for this message is has the form:

    .. code-block:: python

        {
            'events'     : <protocol document events>
            'references' : <model references>
        }

    '''

    msgtype = 'PATCH-DOC'

    @classmethod
    def create(cls, events: List[DocumentPatchedEvent], use_buffers: bool = True, **metadata: Any) -> patch_doc:
        ''' Create a ``PATCH-DOC`` message

        Args:
            events (list) :
                A list of patch events to apply to a document

        Any additional keyword arguments will be put into the message
        ``metadata`` fragment as-is.

        '''
        header = cls.create_header()

        if not events:
            raise ValueError("PATCH-DOC message requires at least one event")

        docs = { event.document for event in events }
        if len(docs) != 1:
            raise ValueError("PATCH-DOC message configured with events for more than one document")

        # this roundtrip is unfortunate, but is needed because there are type conversions
        # in BokehJSONEncoder which keep us from easily generating non-string JSON
        patch_json, buffers = process_document_events(events, use_buffers)
        content = loads(patch_json)

        msg = cls(header, metadata, content)

        for (buffer_header, payload) in buffers:
            msg.add_buffer(buffer_header, payload)

        return msg

    def apply_to_document(self, doc: Document, setter: Setter | None = None) -> None:
        '''

        '''
        invoke_with_curdoc(doc, lambda: doc.apply_json_patch(self.content, setter))

def process_document_events(events: List[DocumentPatchedEvent], use_buffers: bool = True) -> Tuple[str, List[BufferRef]]:
    ''' Create a JSON string describing a patch to be applied as well as
    any optional buffers.

    Args:
      events : list of events to be translated into patches

    Returns:
      str, list :
        JSON string which can be applied to make the given updates to obj
        as well as any optional buffers

    '''

    json_events: List[DocumentPatched] = []
    references: Set[Model] = set()

    buffers: List[BufferRef] | None = [] if use_buffers else None

    for event in events:
        json_events.append(event.generate(references, buffers))

    json = PatchJson(
        events     = json_events,
        references = references_json(references),
    )

    return serialize_json(json), buffers or []

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
