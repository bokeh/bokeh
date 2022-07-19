#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Encapsulate handling of all Bokeh Protocol messages a Bokeh server may
receive.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any, Callable

# Bokeh imports
from ..protocol.exceptions import ProtocolError
from .session import ServerSession

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ProtocolHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class ProtocolHandler:
    ''' A Bokeh server may be expected to receive any of the following protocol
    messages:

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

    _handlers: dict[str, Callable[..., Any]]

    def __init__(self) -> None:
        self._handlers = {}

        self._handlers['PULL-DOC-REQ'] = ServerSession.pull
        self._handlers['PUSH-DOC'] = ServerSession.push
        self._handlers['PATCH-DOC'] = ServerSession.patch
        self._handlers['SERVER-INFO-REQ'] = self._server_info_req

    async def handle(self, message, connection):
        ''' Delegate a received message to the appropriate handler.

        Args:
            message (Message) :
                The message that was receive that needs to be handled

            connection (ServerConnection) :
                The connection that received this message

        Raises:
            ProtocolError

        '''

        handler = self._handlers.get(message.msgtype)

        if handler is None:
            handler = self._handlers.get(message.msgtype)

        if handler is None:
            raise ProtocolError("%s not expected on server" % message)

        try:
            work = await handler(message, connection)
        except Exception as e:
            log.error("error handling message\n message: %r \n error: %r",
                      message, e, exc_info=True)
            work = connection.error(message, repr(e))
        return work

    async def _server_info_req(self, message, connection):
        return connection.protocol.create('SERVER-INFO-REPLY', message.header['msgid'])

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
