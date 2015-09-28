'''

'''
from __future__ import absolute_import

from bokeh.plot_object import PlotObject
from bokeh.document import Document
from json import loads
from ...exceptions import ProtocolError
from ..message import Message
from . import register, nobuffers

@register
@nobuffers
class patch_doc_1(Message):
    '''

    '''

    msgtype  = 'PATCH-DOC'
    revision = 1

    def __init__(self, header, metadata, content):
        super(patch_doc_1, self).__init__(header, metadata, content)

    @classmethod
    def create(cls, session_id, document, obj, updates, **metadata):
        '''

        '''
        header = cls.create_header_with_session(session_id)

        patch_json = document.create_json_patch_string(obj, updates)
        # this is a total hack, the need for it is because we have magic
        # type conversions in our BokehJSONEncoder which keep us from
        # easily generating non-string JSON.
        content = loads(patch_json)

        msg = cls(header, metadata, content)

        return msg

    def apply_to_document(self, doc):
        doc.apply_json_patch(self.content)
