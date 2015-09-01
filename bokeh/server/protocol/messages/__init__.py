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

from .ack import *
from .ok import *
from .error import *
from .server_info_reply import *
from .server_info_req import *
from .working import *



