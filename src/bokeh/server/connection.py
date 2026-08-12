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

# Bokeh imports
from ..protocol import error, ok
from ..protocol.exceptions import ProtocolError
from ..protocol.message import Message

# Bokeh imports
if TYPE_CHECKING:
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

    def __init__(self, transport: WebSocketTransport, session: ServerSession) -> None:
        self._transport = transport
        self._session = session
        self._session.subscribe(self)

    @property
    def session(self) -> ServerSession:
        assert self._session is not None
        return self._session

    def detach_session(self) -> None:
        """Allow the session to be discarded and don't get change notifications from it anymore"""
        if self._session is not None:
            self._session.unsubscribe(self)
            self._session = None

    def ok(self, message: Message[Any]) -> Message[Any]:
        return ok(message.header['msgid'])

    def error(self, message: Message[Any], text: str) -> Message[Any]:
        return error(message.header['msgid'], text)

    async def handle(self, message: Message[Any]) -> Message[Any] | None:
        '''Handle a client request and return its reply.'''
        if message.msgtype not in {"PULL-DOC-REQ", "PUSH-DOC", "PATCH-DOC", "SYNC"}:
            raise ProtocolError(f"{message} not expected on server")

        try:
            if message.msgtype == "PULL-DOC-REQ":
                return await self.session._handle_pull(message, self)
            elif message.msgtype == "PUSH-DOC":
                return await self.session._handle_push(message, self)
            elif message.msgtype == "PATCH-DOC":
                return await self.session._handle_patch(message, self)
            else:
                return self.ok(message)
        except Exception:
            log.exception("error handling %s message", message.msgtype)
            return self.error(message, f"Error handling {message.msgtype} message")

    def send_message(self, message: Message[Any]) -> Awaitable[None]:
        return self._transport.send_message(message)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
