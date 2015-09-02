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
class error_1(Message):
    '''

    '''

    msgtype  = 'ERROR'
    revision = 1

    @classmethod
    def create(cls, session_id, reqid, errname, errval, traceback=None, **metadata):
        '''

        '''
        header = cls.create_header(session_id)
        content = {
            'reqid': reqid,
             'errname' : errname,
            'errval'  : errval,
        }
        if traceback:
            content['traceback'] = traceback.split()
        return cls(header, metadata, content)

    def _handle_server(self, server):
        raise ProtocolError("")

    def _handle_client(self, client):
        log.debug("received ERROR")
