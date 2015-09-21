''' Provides the ``ServerSession`` class.

'''
from __future__ import absolute_import

from tornado.ioloop import IOLoop

from bokeh.util.serialization import make_id

from .server_document import ServerDocument

class ServerSession(object):
    ''' Provide a local cache of Bokeh Documents for an open browser
    tab.

    '''

    def __init__(self, protocol):
        self._id = make_id()
        self._protocol = protocol
        self._documents = dict()

    def __getitem__(self, docid):
        return self._documents[docid]

    def __delitem__(self, docid):
        self.remove_document(docid)

    def __contains__(self, docid):
        return docid in self._documents

    def add_document(self, doc):
        self._documents[doc.id] = doc

    def remove_document(self, docid):
        del self._documents[docid]

    def ok(self, message):
        return self.protocol.create('OK', self.id, message.header['msgid'])

    def error(self, message, text):
        return self.protocol.create('ERROR', self.id, message.header['msgid'], text)

    @property
    def id(self):
        return self._id

    @property
    def protocol(self):
        return self._protocol







