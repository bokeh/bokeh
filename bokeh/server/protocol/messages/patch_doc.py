'''

'''
from __future__ import absolute_import

from bokeh.plot_object import PlotObject
from bokeh.document import Document
from json import loads
from ...exceptions import ProtocolError
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

    def should_suppress_on_change(self, model, attr, new):
        '''Checks whether the patch caused an on_change for the given model, attr, value'''
        if self.content['id'] == model._id and \
           attr in self.content['updates']:
            patch_new = self.content['updates'][attr]
            if isinstance(new, PlotObject):
                return patch_new is not None and 'id' in patch_new and patch_new['id'] == new._id
            else:
                return patch_new == new
        return False

    def apply_to_document(self, doc):
        doc.apply_json_patch(self.content)
