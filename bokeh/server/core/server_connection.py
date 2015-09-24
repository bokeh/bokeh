''' Provides the ``ServerSession`` class.

'''
from __future__ import absolute_import

class ServerConnection(object):
    ''' Wraps a websocket connection to a client.
    '''

    def __init__(self, protocol, tornado_app):
        self._protocol = protocol
        self._tornado_app = tornado_app

    def ok(self, message):
        return self.protocol.create('OK', message.header['msgid'])

    def error(self, message, text):
        return self.protocol.create('ERROR', message.header['msgid'], text)

    def get_or_create_session(self, sessionid):
        return self._tornado_app.get_or_create_session(sessionid)

    @property
    def protocol(self):
        return self._protocol
