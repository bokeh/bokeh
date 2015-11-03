'''

'''
from __future__ import absolute_import, print_function

from ...exceptions import ProtocolError
from ..message import Message
from . import register

import logging
log = logging.getLogger(__name__)

@register
class pull_doc_reply_1(Message):
    '''

    '''

    msgtype  = 'PULL-DOC-REPLY'
    revision = 1

    def __init__(self, header, metadata, content):
        super(pull_doc_reply_1, self).__init__(header, metadata, content)

    @classmethod
    def create(cls, request_id, document, **metadata):
        '''

        '''
        header = cls.create_header(request_id=request_id)

        content = { 'doc' : document.to_json() }

        msg = cls(header, metadata, content)

        return msg

    def push_to_document(self, doc):
        if 'doc' not in self.content:
            raise ProtocolError("No doc in PULL-DOC-REPLY")
        doc.replace_with_json(self.content['doc'])
