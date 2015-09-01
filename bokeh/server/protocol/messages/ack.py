'''

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from ...exceptions import ProtocolError
from ..message import Message
from . import register

@register
class ack_1(Message):
    '''

    '''

    msgtype  = 'ACK'
    revision = 1

    @classmethod
    def create(cls, session_id, **metadata):
        '''

        '''
        header = cls.create_header(session_id)
        content = {}

        return cls(header, metadata, content)

    def add_buffer(self, buf_header, buf_payload):
        '''

        '''
        raise ProtocolError("")

    def write_buffers(self, conn):
        '''

        '''
        return 0

    def is_complete(self):
        '''

        '''
        return True

    def _handle_server(self, server):
        raise ProtocolError("")

    def _handle_client(self, client):
        log.debug("received ACK")
