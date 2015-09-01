'''

'''
from __future__ import absolute_import

from ...exceptions import ProtocolError

index = {}

def register(cls):
    key = (cls.msgtype, cls.revision)
    if key in index:
        raise ProtocolError("Duplicate message specification encountered: %r" % key)
    index[key] = cls
    return cls

def _add_buffer(self, buf_header, buf_payload):
    raise ProtocolError("")

def _write_buffers(self, conn):
    return 0

def _is_complete(self):
    return True

def nobuffers(cls):
    '''

    '''
    cls.add_buffer = _add_buffer
    cls.write_buffers = _write_buffers
    cls.is_complete = _is_complete
    return cls

from .ack import *
from .ok import *
from .error import *
from .server_info_reply import *
from .server_info_req import *
from .working import *



