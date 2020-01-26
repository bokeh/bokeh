#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..exceptions import ProtocolError
from ..message import Message

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

class pull_doc_reply(Message):
    ''' Define the ``PULL-DOC-REPLY`` message for replying to Document pull
    requests from clients

    The ``content`` fragment of for this message is has the form:

    .. code-block:: python

        {
            'doc' : <Document JSON>
        }

    '''

    msgtype  = 'PULL-DOC-REPLY'

    def __init__(self, header, metadata, content):
        super().__init__(header, metadata, content)

    @classmethod
    def create(cls, request_id, document, **metadata):
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

        content = { 'doc' : document.to_json() }

        msg = cls(header, metadata, content)

        return msg

    def push_to_document(self, doc):
        if 'doc' not in self.content:
            raise ProtocolError("No doc in PULL-DOC-REPLY")
        doc.replace_with_json(self.content['doc'])

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
