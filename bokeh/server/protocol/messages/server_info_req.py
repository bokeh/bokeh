'''

'''
from __future__ import absolute_import

from ..message import Message
from . import register

@register
class server_info_req_1(Message):
    '''

    '''

    msgtype   = 'SERVER-INFO-REQ'
    revision = 1

    @classmethod
    def create(cls, **metadata):
        '''

        '''
        header = cls.create_header()
        content = {}
        return cls(header, metadata, content)
