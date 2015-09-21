'''

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from tornado import gen

from ..core.server_document import ServerDocument
from ..exceptions import ProtocolError

class ServerHandler(object):
    '''

    '''

    def __init__(self, protocol):
        self._handlers = dict()

        self._handlers['PULL-DOC-REQ'] = ServerDocument.pull
        self._handlers['PUSH-DOC'] = ServerDocument.push
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

