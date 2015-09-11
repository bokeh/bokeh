'''

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from ..message import Message
from . import nobuffers, register


@register
@nobuffers
class ok_1(Message):
    '''

    '''

    msgtype  = 'OK'
    revision = 1

    @classmethod
    def create(cls, session_id, reqid, **metadata):
        '''

        '''
        header = cls.create_header(session_id)
        content = {
            'reqid': reqid,
        }
        return cls(header, metadata, content)
