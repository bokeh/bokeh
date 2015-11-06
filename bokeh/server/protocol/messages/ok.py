'''

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from ..message import Message
from . import register


@register
class ok_1(Message):
    '''

    '''

    msgtype  = 'OK'
    revision = 1

    @classmethod
    def create(cls, request_id, **metadata):
        '''

        '''
        header = cls.create_header(request_id=request_id)
        return cls(header, metadata, {})
