#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from typing import TYPE_CHECKING, Any, TypedDict

# Bokeh imports
from ...core.serialization import Serialized
from ..exceptions import ProtocolError
from ..message import Message

if TYPE_CHECKING:
    from ...document.document import DocJson, Document

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'push_doc',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class PushDoc(TypedDict):
    doc: DocJson

class push_doc(Message[PushDoc]):
    ''' Define the ``PUSH-DOC`` message for pushing Documents from clients to a
    Bokeh server.

    The ``content`` fragment of for this message is has the form:

    .. code-block:: python

        {
            'doc' : <Document JSON>
        }

    '''

    msgtype = 'PUSH-DOC'

    @classmethod
    def create(cls, document: Document, **metadata: Any) -> push_doc:
        '''

        '''
        header = cls.create_header()

        serialized = document.to_json()
        content = PushDoc(doc=serialized.content)

        msg = cls(header, metadata, content)
        msg.add_buffers(*serialized.buffers)

        return msg

    def push_to_document(self, doc: Document) -> None:
        '''

        Raises:
            ProtocolError

        '''
        if "doc" not in self.content:
            raise ProtocolError("No doc in PUSH-DOC")
        doc_json = Serialized(self.content["doc"], self.buffers)
        doc.replace_with_json(doc_json)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
