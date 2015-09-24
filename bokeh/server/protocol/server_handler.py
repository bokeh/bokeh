'''

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from tornado import gen

from ..core.server_session import ServerSession
from ..exceptions import ProtocolError

class ServerHandler(object):
    '''

    '''

    def __init__(self, protocol):
        self._handlers = dict()

        self._handlers['PULL-DOC-REQ'] = self._session_handler(ServerSession.pull)
        self._handlers['PUSH-DOC'] = self._session_handler(ServerSession.push)
        self._handlers['SERVER-INFO-REQ'] = self._server_info_req

    def _session_handler(self, handler):
        def handler_without_session(message, connection):
            if 'sessid' not in message.header:
                raise ProtocolError("%s missing sessid header" % message)
            sessionid = message.header['sessid']
            if len(sessionid) == 0:
                raise ProtocolError("%s empty sessid header" % message)

            # TODO (havocp) creation of the session shouldn't happen here,
            # it should probably be via some explicit protocol request.
            session = connection.get_or_create_session(sessionid, '/')
            return handler(message, connection, session)
        return handler_without_session

    @gen.coroutine
    def handle(self, message, connection):
        handler = self._handlers.get((message.msgtype, message.revision), None)

        if handler is None:
            handler = self._handlers.get(message.msgtype, None)

        if handler is None:
            raise ProtocolError("%s not expected on server" % message)

        work = handler(message, connection)

        raise gen.Return(work)

    def _server_info_req(self, message, connection):
        return connection.protocol.create('SERVER-INFO-REPLY')

