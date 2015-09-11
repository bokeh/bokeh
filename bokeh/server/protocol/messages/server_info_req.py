'''

'''
from __future__ import absolute_import

from ..message import Message
from . import nobuffers, register

@register
@nobuffers
class server_info_req_1(Message):
    '''

    '''

    msgtype   = 'SERVER-INFO-REQ'
    revision = 1

    @classmethod
    def create(cls, session_id, **metadata):
        '''

        '''
        header = cls.create_header(session_id)
        content = {}
        return cls(header, metadata, content)
