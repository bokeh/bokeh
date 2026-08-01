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
from typing import TYPE_CHECKING, Any, Awaitable, cast

# Bokeh imports
from ..protocol import create
from ..protocol.exceptions import ProtocolError
from ..protocol.message import Message
from ..protocol.messages import patch_doc, pull_doc_req, push_doc, server_info_req

## Bokeh imports
if TYPE_CHECKING:
    from ..protocol import messages as msg
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
        self._ping_count = 0

    @property
    def session(self) -> ServerSession:
        assert self._session is not None
        return self._session

    def detach_session(self) -> None:
        """Allow the session to be discarded and don't get change notifications from it anymore"""
        if self._session is not None:
            self._session.unsubscribe(self)
            self._session = None

    def ok(self, message: Message[Any]) -> msg.ok:
        return create('OK', message.header['msgid'])

    def error(self, message: Message[Any], text: str) -> msg.error:
        return create('ERROR', message.header['msgid'], text)

    async def handle(self, message: Message[Any]) -> Message[Any] | None:
        '''Handle a client request and return its reply.'''
        if not isinstance(message, (pull_doc_req, push_doc, patch_doc, server_info_req)):
            raise ProtocolError(f"{message} not expected on server")

        try:
            if isinstance(message, pull_doc_req):
                return await cast(Awaitable[Message[Any] | None], self.session._handle_pull(message, self))
            elif isinstance(message, push_doc):
                return await cast(Awaitable[Message[Any] | None], self.session._handle_push(message, self))
            elif isinstance(message, patch_doc):
                return await cast(Awaitable[Message[Any] | None], self.session._handle_patch(message, self))
            else:
                return create('SERVER-INFO-REPLY', message.header['msgid'])
        except Exception:
            log.exception("error handling %s message", message.msgtype)
            return self.error(message, f"Error handling {message.msgtype} message")

    def send_message(self, message: Message[Any]) -> Awaitable[None]:
        return self._transport.send_message(message)

    def send_ping(self) -> None:
        self._transport.ping(str(self._ping_count).encode("utf-8"))
        self._ping_count += 1

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
