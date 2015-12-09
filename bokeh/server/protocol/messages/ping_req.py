'''

'''
from __future__ import absolute_import

from ..message import Message
from . import register

@register
class ping_req_1(Message):
    '''

    '''

    msgtype   = 'PING-REQ'
    revision = 1

    @classmethod
    def create(cls, sequence, **metadata):
        '''

        '''
        header = cls.create_header()
        content = { 'sequence' : sequence }
        return cls(header, metadata, content)
