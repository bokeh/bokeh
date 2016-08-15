'''

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from tornado import gen

from ..session import ServerSession
from ..exceptions import ProtocolError

class ServerHandler(object):
    '''

    '''

    def __init__(self):
        self._handlers = dict()

        self._handlers['PULL-DOC-REQ'] = ServerSession.pull
        self._handlers['PUSH-DOC'] = ServerSession.push
        self._handlers['PATCH-DOC'] = ServerSession.patch
        self._handlers['SERVER-INFO-REQ'] = self._server_info_req

    @gen.coroutine
    def handle(self, message, connection):
        handler = self._handlers.get((message.msgtype, message.revision))

        if handler is None:
            handler = self._handlers.get(message.msgtype)

        if handler is None:
            raise ProtocolError("%s not expected on server" % message)

        try:
            work = yield handler(message, connection)
        except Exception as e:
            log.error("error handling message %r: %r", message, e)
            log.debug("  message header %r content %r", message.header, message.content, exc_info=1)
            work = connection.error(message, repr(e))
        raise gen.Return(work)

    @gen.coroutine
    def _server_info_req(self, message, connection):
        raise gen.Return(connection.protocol.create('SERVER-INFO-REPLY', message.header['msgid']))
