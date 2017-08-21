from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from ..message import Message
from . import register

@register
class ok_1(Message):
    ''' Define the ``OK`` message (revision 1) for acknowledging successful
    handling of a previous message.

    The ``content`` fragment of for this message is empty.

    '''

    msgtype  = 'OK'
    revision = 1

    @classmethod
    def create(cls, request_id, **metadata):
        ''' Create an ``OK`` message

        Args:
            request_id (str) :
                The message ID for the message the precipitated the OK.

        Any additional keyword arguments will be put into the message
        ``metadata`` fragment as-is.

        '''
        header = cls.create_header(request_id=request_id)
        return cls(header, metadata, {})
