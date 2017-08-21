from __future__ import absolute_import, print_function

from ..exceptions import ProtocolError
from ..message import Message
from . import register

import logging
log = logging.getLogger(__name__)

@register
class push_doc_1(Message):
    ''' Define the ``PUSH-DOC`` message (revision 1) for pushing Documents
    from clients to a Bokeh server.

    The ``content`` fragment of for this message is has the form:

    .. code-block:: python

        {
            'doc' : <Document JSON>
        }

    '''

    msgtype  = 'PUSH-DOC'
    revision = 1

    def __init__(self, header, metadata, content):
        super(push_doc_1, self).__init__(header, metadata, content)

    @classmethod
    def create(cls, document, **metadata):
        '''

        '''
        header = cls.create_header()

        content = { 'doc' : document.to_json() }

        msg = cls(header, metadata, content)

        return msg

    def push_to_document(self, doc):
        '''

        Raises:
            ProtocolError

        '''
        if 'doc' not in self.content:
            raise ProtocolError("No doc in PUSH-DOC")
        doc.replace_with_json(self.content['doc'])
