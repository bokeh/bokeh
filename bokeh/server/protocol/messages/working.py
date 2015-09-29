'''

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from ..message import Message
from . import register

@register
class working_1(Message):
    '''

    '''

    msgtype  = 'WORKING'
    revision = 1

    @classmethod
    def create(cls, session_id, request_id, **metadata):
        '''

        '''
        header = cls.create_header(session_id=session_id, request_id=request_id)
        content = {}
        return cls(header, metadata, content)
