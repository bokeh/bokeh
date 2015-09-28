'''

'''
from __future__ import absolute_import

from ..message import Message
from . import register

@register
class pull_doc_req_1(Message):
    '''

    '''

    msgtype   = 'PULL-DOC-REQ'
    revision = 1

    @classmethod
    def create(cls, session_id, **metadata):
        '''

        '''
        header = cls.create_header_with_session(session_id)
        return cls(header, metadata, {})
