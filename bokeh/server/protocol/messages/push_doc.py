'''

'''
from __future__ import absolute_import

from ...exceptions import ProtocolError
from ..message import Message
from . import register

@register
class push_doc_1(Message):
    '''

    '''

    msgtype  = 'PUSH-DOC'
    revision = 1

    def __init__(self, header, metadata, content):
        super(push_doc_1, self).__init__(header, metadata, content)
        self._buffers = []

    @classmethod
    def create(cls, session_id, document, **metadata):
        '''

        '''
        header = cls.create_header_with_session(session_id)
        content = {
            'num_buffers' : 0,
        }
        msg = cls(header, metadata, content)
        # TODO (bev) add buffers here
        return msg

    def add_buffer(self, buf_header, buf_payload):
        if self.content['num_buffers'] >= len(self._buffers):
            raise ProtocolError("too many buffers received")
        self._buffers.append((buf_header, buf_payload))

    def write_buffers(self, conn):
        sent = 0
        for header, payload in self._buffers:
            conn.write_message(header)
            conn.write_message(payload)
            sent += (len(header) + len(payload))
        return sent

    def is_complete(self):
        return self.content['num_buffers'] == len(self._buffers)

