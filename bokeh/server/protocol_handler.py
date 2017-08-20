''' Encapsulate handling of all Bokeh Protocol messages a Bokeh server may
receive.

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from tornado import gen

from .session import ServerSession
from ..protocol.exceptions import ProtocolError

class ProtocolHandler(object):
    ''' A Bokeh server may be expected to receive any of the following protocol
    messages:

    * ``EVENT``
    * ``PATCH-DOC``
    * ``PULL-DOC-REQ``
    * ``PUSH-DOC``
    * ``SERVER-INFO-REQ``

    The job of ``ProtocolHandler`` is to direct incoming messages to the right
    specialized handler for each message type. When the server receives a new
    message on a connection it will call ``handler`` with the message and the
    connection that the message arrived on. Most messages are ultimately
    handled by the ``ServerSession`` class, but some simpler messages types
    such as ``SERVER-INFO-REQ`` may be handled directly by ``ProtocolHandler``.

    Any unexpected messages will result in a ``ProtocolError``.

    '''

    def __init__(self):
        self._handlers = dict()

        self._handlers['PULL-DOC-REQ'] = ServerSession.pull
        self._handlers['PUSH-DOC'] = ServerSession.push
        self._handlers['PATCH-DOC'] = ServerSession.patch
        self._handlers['SERVER-INFO-REQ'] = self._server_info_req
        self._handlers['EVENT'] = ServerSession.event

    @gen.coroutine
    def handle(self, message, connection):
        ''' Delegate a received message to the appropriate handler.

        Args:
            message (Message) :
                The message that was receive that needs to be handled

            connection (ServerConnection) :
                The connection that received this message

        Raises:
            ProtocolError

        '''

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
