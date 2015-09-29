'''

'''
from __future__ import absolute_import, print_function

from bokeh.plot_object import PlotObject
from bokeh.document import Document
from json import loads
from ...exceptions import ProtocolError
from ..message import Message
from . import register

import logging
log = logging.getLogger(__name__)

@register
class push_doc_1(Message):
    '''

    '''

    msgtype  = 'PUSH-DOC'
    revision = 1

    def __init__(self, header, metadata, content):
        super(push_doc_1, self).__init__(header, metadata, content)

    @classmethod
    def create(cls, session_id, document, **metadata):
        '''

        '''
        header = cls.create_header(session_id=session_id)

        doc_json = document.to_json_string()
        # this is a total hack, the need for it is because we have magic
        # type conversions in our BokehJSONEncoder which keep us from
        # easily generating non-string JSON.
        content = { 'doc' : loads(doc_json) }

        msg = cls(header, metadata, content)

        return msg

    def push_to_document(self, doc):
        if 'doc' not in self.content:
            raise ProtocolError("No doc in PUSH-DOC")
        pushed_doc_json = self.content['doc']
        pushed_doc = Document.from_json(pushed_doc_json)

        # we only clear the doc after ensuring we can parse everything above,
        # so we don't nuke the doc only to throw a ProtocolError
        doc.clear()
        while pushed_doc.roots:
            r = next(iter(pushed_doc.roots))
            pushed_doc.remove_root(r)
            doc.add_root(r)
        # TODO other fields of doc
