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
    def create(cls, **metadata):
        '''

        '''
        header = cls.create_header()
        return cls(header, metadata, {})
