'''

'''
from __future__ import absolute_import

from bokeh import __version__

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
    def create(cls, request_id, **metadata):
        '''

        '''
        header = cls.create_header(request_id=request_id)
        content = {
            'version_info': _VERSION_INFO,
        }
        return cls(header, metadata, content)
