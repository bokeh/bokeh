#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
from typing import TYPE_CHECKING, Any

# External imports
from typing_extensions import TypedDict

# Bokeh imports
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
        content = PushDoc(doc=document.to_json())

        msg = cls(header, metadata, content)
        return msg

    def push_to_document(self, doc: Document) -> None:
        '''

        Raises:
            ProtocolError

        '''
        if 'doc' not in self.content:
            raise ProtocolError("No doc in PUSH-DOC")
        doc.replace_with_json(self.content['doc'])

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
