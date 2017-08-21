from __future__ import absolute_import

from ..message import Message
from . import register

@register
class server_info_req_1(Message):
    ''' Define the ``SERVER-INFO-REQ`` message (revision 1) for requesting a
    Bokeh server provide information about itself.

    The ``content`` fragment of for this message is empty.

    '''

    msgtype   = 'SERVER-INFO-REQ'
    revision = 1

    @classmethod
    def create(cls, **metadata):
        ''' Create an ``SERVER-INFO-REQ`` message

        Any keyword arguments will be put into the message ``metadata``
        fragment as-is.

        '''
        header = cls.create_header()
        content = {}
        return cls(header, metadata, content)
