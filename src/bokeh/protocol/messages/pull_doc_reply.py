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
    from ...core.types import ID
    from ...document.document import DocJson, Document

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'pull_doc_reply',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class PullDoc(TypedDict):
    doc: DocJson

class pull_doc_reply(Message[PullDoc]):
    ''' Define the ``PULL-DOC-REPLY`` message for replying to Document pull
    requests from clients

    The ``content`` fragment of for this message is has the form:

    .. code-block:: python

        {
            'doc' : <Document JSON>
        }

    '''

    msgtype = 'PULL-DOC-REPLY'

    @classmethod
    def create(cls, request_id: ID, document: Document, **metadata: Any) -> pull_doc_reply:
        ''' Create an ``PULL-DOC-REPLY`` message

        Args:
            request_id (str) :
                The message ID for the message that issues the pull request

            document (Document) :
                The Document to reply with

        Any additional keyword arguments will be put into the message
        ``metadata`` fragment as-is.

        '''
        header = cls.create_header(request_id=request_id)

        serialized = document.to_json()
        content = PullDoc(doc=serialized.content)

        msg = cls(header, metadata, content)
        msg.add_buffers(*serialized.buffers)

        return msg

    def push_to_document(self, doc: Document) -> None:
        if "doc" not in self.content:
            raise ProtocolError("No doc in PULL-DOC-REPLY")
        doc_json = Serialized(self.content["doc"], self.buffers)
        doc.replace_with_json(doc_json)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
