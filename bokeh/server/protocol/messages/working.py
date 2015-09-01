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
class working_1(Message):
    '''

    '''

    msgtype  = 'WORKING'
    revision = 1

    @classmethod
    def create(cls, session_id, reqid, **metadata):
        '''

        '''
        header = cls.create_header(session_id)
        content = {
            'reqid' : reqid,
        }
        return cls(header, metadata, content)

    def _handle_server(self, server):
        raise ProtocolError("")

    def _handle_client(self, client):
        log.debug("received WORKING")
