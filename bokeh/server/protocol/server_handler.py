'''

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from tornado import gen

from ..exceptions import ProtocolError

class ServerHandler(object):
    '''

    '''

    def __init__(self, protocol):
        self._handlers = dict()

        self._handlers['PULL-DOC-REQ'] = self._pull_doc_req
        self._handlers['PUSH-DOC'] = self._push_doc
        self._handlers['SERVER-INFO-REQ'] = self._server_info_req

    @gen.coroutine
    def handle(self, message, session):
        handler = self._handlers.get((message.msgtype, message.revision), None)

        if handler is None:
            handler = self._handlers.get(message.msgtype, None)

        if handler is None:
            raise ProtocolError("%s not expected on server" % message)

        raise gen.Return(handler(message, session))

    def ok(self, message, session):
        return session.protocol.create('OK', session.id, message.header['msgid'])

    def error(self, message, session, text):
        return session.protocol.create('ERROR', session.id, message.header['msgid'], text)

    def _pull_doc_req(self, message, session):
        try:
            log.debug("Pulling Document %r", message.content['docid'])
            return self.ok(message, session)
        except Exception as e:
            text = "Error pulling Document"
            log.error(text)
            return self.error(message, session, text)

    def _push_doc(self, message, session):
        try:
            log.debug("Pushing Document")
            session.storage.push_doc(message)
            return self.ok(message, session)
        except Exception as e:
            text = "Error pushing Document"
            log.error(text)
            return self.error(message, session, text)

    def _server_info_req(self, message, session):
        return session.protocol.create('SERVER-INFO-REPLY', session.id)