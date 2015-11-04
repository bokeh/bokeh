'''

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from ..message import Message
from . import register

@register
class ack_1(Message):
    '''

    '''

    msgtype  = 'ACK'
    revision = 1

    @classmethod
    def create(cls, **metadata):
        '''

        '''
        header = cls.create_header()
        content = {}
        return cls(header, metadata, content)
