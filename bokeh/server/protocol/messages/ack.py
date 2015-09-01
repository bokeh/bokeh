'''

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from ...exceptions import ProtocolError
from ..message import Message
from . import nobuffers, register

@register
@nobuffers
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

    def _handle_server(self, server):
        raise ProtocolError("")

    def _handle_client(self, client):
        log.debug("received ACK")
