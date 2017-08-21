from __future__ import absolute_import, print_function

from ..exceptions import ProtocolError
from ..message import Message
from . import register

import logging
log = logging.getLogger(__name__)

@register
class pull_doc_reply_1(Message):
    ''' Define the ``PULL-DOC-REPLY`` message (revision 1) for replying to
    Document pull requests from clients

    The ``content`` fragment of for this message is has the form:

    .. code-block:: python

        {
            'doc' : <Document JSON>
        }

    '''

    msgtype  = 'PULL-DOC-REPLY'
    revision = 1

    def __init__(self, header, metadata, content):
        super(pull_doc_reply_1, self).__init__(header, metadata, content)

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
