'''

'''
from __future__ import absolute_import

from json import loads
from ..message import Message
from . import register

@register
class patch_doc_1(Message):
    '''

    '''

    msgtype  = 'PATCH-DOC'
    revision = 1

    def __init__(self, header, metadata, content):
        super(patch_doc_1, self).__init__(header, metadata, content)

    @classmethod
    def create(cls, events, **metadata):
        '''

        '''
        header = cls.create_header()

        if not events:
            raise ValueError("PATCH-DOC message requires at least one event")
        document = events[0].document

        patch_json = document.create_json_patch_string(events)
        # this is a total hack, the need for it is because we have magic
        # type conversions in our BokehJSONEncoder which keep us from
        # easily generating non-string JSON.
        content = loads(patch_json)

        msg = cls(header, metadata, content)

        return msg

    def apply_to_document(self, doc, setter=None):
        doc.apply_json_patch(self.content, setter)
