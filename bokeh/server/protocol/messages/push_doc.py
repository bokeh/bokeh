'''

'''
from __future__ import absolute_import, print_function

from bokeh.plot_object import PlotObject
from bokeh.document import Document
from ...exceptions import ProtocolError
from ..message import Message
from . import register

@register
class push_doc_1(Message):
    '''

    '''

    msgtype  = 'PUSH-DOC'
    revision = 1

    def __init__(self, header, metadata, content, buffers=None):
        super(push_doc_1, self).__init__(header, metadata, content)
        if buffers is None:
            self._buffers = []
        else:
            self._buffers = buffers

    @classmethod
    def create(cls, session_id, document, **metadata):
        '''

        '''
        header = cls.create_header_with_session(session_id)

        buffers = []
        buffers.append(('doc', document.to_json_string().encode('utf-8')))

        content = {
            'num_buffers' : len(buffers)
        }
        msg = cls(header, metadata, content, buffers)

        return msg

    def add_buffer(self, buf_header, buf_payload):
        if self.content['num_buffers'] <= len(self._buffers):
            raise ProtocolError("too many buffers received expecting " + str(self.content['num_buffers']))
        self._buffers.append((buf_header, buf_payload))

    def write_buffers(self, conn):
        sent = 0
        for header, payload in self._buffers:
            conn.write_message(header)
            conn.write_message(payload, binary=True)
            sent += (len(header) + len(payload))
        return sent

    def is_complete(self):
        return self.content['num_buffers'] == len(self._buffers)

    def push_to_document(self, doc):
        pushed_doc = None
        for b in self._buffers:
            header = b[0]
            payload = b[1]
            if header == 'doc':
                if pushed_doc is not None:
                    raise ProtocolError("multiple docs in PUSH-DOC")
                pushed_doc = Document.from_json_string(payload.decode('utf-8'))
            else:
                raise ProtocolError("Unknown PUSH-DOC buffer header: " + header)

        if pushed_doc is None:
            raise ProtocolError("No doc in PUSH-DOC")

        # we only clear the doc after ensuring we can parse everything above,
        # so we don't nuke the doc only to throw a ProtocolError
        doc.clear()
        while pushed_doc.roots:
            r = next(iter(pushed_doc.roots))
            pushed_doc.remove_root(r)
            doc.add_root(r)
        # TODO other fields of doc
