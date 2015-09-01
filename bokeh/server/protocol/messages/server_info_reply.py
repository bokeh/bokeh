'''

'''
from __future__ import absolute_import

from bokeh import __version__

from ...exceptions import ProtocolError
from ..message import Message
from . import register

_VERSION_INFO = {
    'bokeh'  : __version__,
    'server' : __version__,
}

@register
class server_info_reply_1(Message):
    '''

    '''

    msgtype  = 'SERVER-INFO-REPLY'
    revision = 1

    @classmethod
    def create(cls, session_id, **metadata):
        '''

        '''
        header = cls.create_header(session_id)
        content = {
            'version_info': _VERSION_INFO,
        }

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
        pass
