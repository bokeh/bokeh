from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from ..message import Message
from . import register

@register
class ack_1(Message):
    ''' Define the ``ACK`` message (revision 1) for acknowledging successful
    client connection to a Bokeh server.

    The ``content`` fragment of for this message is empty.

    '''

    msgtype  = 'ACK'
    revision = 1

    @classmethod
    def create(cls, **metadata):
        ''' Create an ``ACK`` message

        Any keyword arguments will be put into the message ``metadata``
        fragment as-is.

        '''
        header = cls.create_header()
        content = {}
        return cls(header, metadata, content)
