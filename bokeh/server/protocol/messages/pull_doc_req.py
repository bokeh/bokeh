'''

'''
from __future__ import absolute_import

from ..message import Message
from . import nobuffers, register

@register
@nobuffers
class pull_doc_req_1(Message):
    '''

    '''

    msgtype   = 'PULL-DOC-REQ'
    revision = 1

    @classmethod
    def create(cls, session_id, docid, **metadata):
        '''

        '''
        header = cls.create_header(session_id)
        content = {
            'docid' : docid,
        }
        return cls(header, metadata, content)
