''' Provides the ``ServerSession`` class.

'''
from __future__ import absolute_import

class ServerConnection(object):
    ''' Wraps a websocket connection to a client.
    '''

    def __init__(self, protocol, socket, application_context, session):
        self._protocol = protocol
        self._socket = socket
        self._application_context = application_context
        self._session = session
        self._session.subscribe(self)

    @property
    def session(self):
        return self._session

    @property
    def application_context(self):
        return self._application_context

    def detach_session(self):
        """Allow the session to be discarded and don't get change notifications from it anymore"""
        if self._session is not None:
            self._session.unsubscribe(self)
            self._session = None

    def ok(self, message):
        return self.protocol.create('OK', message.header['msgid'])

    def error(self, message, text):
        return self.protocol.create('ERROR', message.header['msgid'], text)

    def send_patch_document(self, event):
        msg = self.protocol.create('PATCH-DOC', [event])
        self._socket.send_message(msg)

    @property
    def protocol(self):
        return self._protocol
