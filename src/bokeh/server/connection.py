#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provides the ``ServerSession`` class.

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
from typing import TYPE_CHECKING, Any, Awaitable

## Bokeh imports
if TYPE_CHECKING:
    from ..protocol import Protocol, messages as msg
    from ..protocol.message import Message
    from .contexts import ApplicationContext
    from .session import ServerSession
    from .transport import WebSocketTransport

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ServerConnection',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class ServerConnection:
    ''' Wraps a websocket connection to a client.

    '''

    _session: ServerSession | None

    def __init__(self, protocol: Protocol, socket: WebSocketTransport,
            application_context: ApplicationContext, session: ServerSession) -> None:
        self._protocol = protocol
        self._socket = socket
        self._application_context = application_context
        self._session = session
        self._session.subscribe(self)
        self._ping_count = 0

    @property
    def session(self) -> ServerSession:
        assert self._session is not None
        return self._session

    @property
    def application_context(self) -> ApplicationContext:
        return self._application_context

    def detach_session(self) -> None:
        """Allow the session to be discarded and don't get change notifications from it anymore"""
        if self._session is not None:
            self._session.unsubscribe(self)
            self._session = None

    def ok(self, message: Message[Any]) -> msg.ok:
        return self.protocol.create('OK', message.header['msgid'])

    def error(self, message: Message[Any], text: str) -> msg.error:
        return self.protocol.create('ERROR', message.header['msgid'], text)

    def send_message(self, message: Message[Any]) -> Awaitable[None]:
        return self._socket.send_message(message)

    def send_ping(self) -> None:
        self._socket.ping(str(self._ping_count).encode("utf-8"))
        self._ping_count += 1

    @property
    def protocol(self) -> Protocol:
        return self._protocol

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
