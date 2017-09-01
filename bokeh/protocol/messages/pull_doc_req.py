from __future__ import absolute_import

from ..message import Message
from . import register

@register
class pull_doc_req_1(Message):
    ''' Define the ``PULL-DOC-REQ`` message (revision 1) for requesting a
    Bokeh server reply with a new Bokeh Document.

    The ``content`` fragment of for this message is empty.

    '''

    msgtype   = 'PULL-DOC-REQ'
    revision = 1

    @classmethod
    def create(cls, **metadata):
        ''' Create an ``PULL-DOC-REQ`` message

        Any keyword arguments will be put into the message ``metadata``
        fragment as-is.

        '''
        header = cls.create_header()
        return cls(header, metadata, {})
