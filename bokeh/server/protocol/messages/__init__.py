'''

'''
from __future__ import absolute_import

from ...exceptions import ProtocolError

index = {}

def register(cls):
    ''' Decorator to add a Message (and its revision) to the Protocol index.

    '''
    key = (cls.msgtype, cls.revision)
    if key in index:
        raise ProtocolError("Duplicate message specification encountered: %r" % key)
    index[key] = cls
    return cls

from .ack import *
from .ok import *
from .patch_doc import *
from .pull_doc_req import *
from .pull_doc_reply import *
from .push_doc import *
from .error import *
from .server_info_reply import *
from .server_info_req import *
