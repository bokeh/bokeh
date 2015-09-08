'''

'''
from __future__ import absolute_import

from tornado import gen

from ..exceptions import ProtocolError

class ServerHandler(object):
    '''

    '''

    def __init__(self, protocol):
        self._handlers = dict()

        self._handlers['SERVER-INFO-REQ'] = self._server_info_req

    @gen.coroutine
    def handle(self, message, session):
        handler = self._handlers.get((message.msgtype, message.revision), None)

        if handler is None:
            handler = self._handlers.get(message.msgtype, None)

        if handler is None:
            raise ProtocolError("%s not expected on server" % message)

        raise gen.Return(handler(message, session))


    def _server_info_req(self, message, session):
        return session.protocol.create('SERVER-INFO-REPLY', session.id)
