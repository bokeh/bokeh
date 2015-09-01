'''

'''
from __future__ import absolute_import

from ...exceptions import ProtocolError
from ..message import Message
from . import register

@register
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
        response = server.session.protocol.create('SERVER-INFO-REPLY', server.session.id)
        server.send_message(response)

    def _handle_client(self, client):
        raise ProtocolError("")

