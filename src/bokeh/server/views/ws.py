#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a web socket handler for the Bokeh Server application.

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
import calendar
import datetime as dt
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, cast
from urllib.parse import urlparse

# External imports
from tornado import locks, web
from tornado.websocket import WebSocketClosedError, WebSocketHandler

# Bokeh imports
from bokeh.settings import settings
from bokeh.util.token import check_token_signature, get_session_id, get_token_payload

# Bokeh imports
from ...protocol import ack
from ...protocol.exceptions import ProtocolError
from ...protocol.message import Message
from ...protocol.receiver import Receiver
from .auth_request_handler import AuthRequestHandler

if TYPE_CHECKING:
    from tornado.web import Application

    from ..connection import ServerConnection
    from ..contexts import ApplicationContext
    from ..request import RequestLike
    from ..tornado import BokehTornado

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'WSHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class WSHandler(AuthRequestHandler, WebSocketHandler):
    ''' Implements a custom Tornado WebSocketHandler for the Bokeh Server.

    '''

    application: BokehTornado
    application_context: ApplicationContext
    connection: ServerConnection | None
    receiver: Receiver | None
    _token: str | None

    def __init__(self, tornado_app: Application, *args: Any, **kw: Any) -> None:
        self.receiver = None
        self.connection = None
        self.application_context = kw['application_context']
        # write_lock allows us to lock the connection to send multiple
        # messages atomically.
        self.write_lock = locks.Lock()

        self._token = None

        self._compression_level = kw.pop('compression_level', None)
        self._mem_level = kw.pop('mem_level', None)

        # Note: tornado_app is stored as self.application
        super().__init__(tornado_app, *args, **kw)

    def initialize(self, application_context: ApplicationContext, bokeh_websocket_path: str) -> None:
        pass

    def check_origin(self, origin: str) -> bool:
        ''' Implement a check_origin policy for Tornado to call.

        The supplied origin will be compared to the Bokeh server allowlist. If the
        origin is not allow, an error will be logged and ``False`` will be returned.

        Args:
            origin (str) :
                The URL of the connection origin

        Returns:
            bool, True if the connection is allowed, False otherwise

        '''
        from ..util import check_allowlist
        parsed_origin = urlparse(origin)
        origin_host = parsed_origin.netloc.lower()

        allowed_hosts = self.application.websocket_origins
        if settings.allowed_ws_origin():
            allowed_hosts = set(settings.allowed_ws_origin())


        if check_allowlist(origin_host, list(allowed_hosts)):
            return True

        log.error("Refusing websocket connection from Origin '%s'; \
                    use --allow-websocket-origin=%s or set BOKEH_ALLOW_WS_ORIGIN=%s to permit this; currently we allow origins %r",
                    origin, origin_host, origin_host, allowed_hosts)
        return False

    @web.authenticated
    def open(self) -> None:
        ''' Initialize a connection to a client.

        Returns:
            None

        '''
        log.info('WebSocket connection opened')
        token = self._token

        if self.selected_subprotocol != 'bokeh':
            self.close()
            raise ProtocolError("Subprotocol header is not 'bokeh'")
        elif token is None:
            self.close()
            raise ProtocolError("No token received in subprotocol header")

        now = calendar.timegm(dt.datetime.now(tz=dt.UTC).timetuple())
        if not check_token_signature(token,
                                     signed=self.application.sign_sessions,
                                     secret_key=self.application.secret_key):
            session_id = get_session_id(token)
            log.error("Token for session %r had invalid signature", session_id)
            self.close()
            raise ProtocolError("Invalid token signature")

        payload = get_token_payload(token)
        if 'session_expiry' not in payload:
            self.close()
            raise ProtocolError("Session expiry has not been provided")
        elif now >= payload['session_expiry']:
            self.close()
            raise ProtocolError("Token is expired. Configure the app with a larger value for --session-token-expiration if necessary")

        try:
            self.application.io_loop.add_callback(self._async_open, self._token)
        except Exception as e:
            # this isn't really an error (unless we have a
            # bug), it just means a client disconnected
            # immediately, most likely.
            log.debug("Failed to fully open connection %r", e)

    def select_subprotocol(self, subprotocols: list[str]) -> str | None:
        log.debug('Subprotocol header received')
        log.trace('Supplied subprotocol headers: %r', subprotocols) # type: ignore[attr-defined]
        if not len(subprotocols) == 2:
            return None
        self._token = subprotocols[1]
        return subprotocols[0]

    def get_compression_options(self) -> dict[str, Any] | None:
        if self._compression_level is None:
            return None
        options = {'compression_level': self._compression_level}
        if self._mem_level is not None:
            options['mem_level'] = self._mem_level
        return options

    async def _async_open(self, token: str) -> None:
        ''' Perform the specific steps needed to open a connection to a Bokeh session

        Specifically, this method coordinates:

        * Getting a session for a session ID (creating a new one if needed)
        * Creating a protocol receiver
        * Opening a new ServerConnection and sending it an ACK

        Args:
            token (str) :
                A token containing the ID of the session to connect to

                If no session exists with the given ID, a new session is made

        Returns:
            None

        '''
        try:
            session_id = get_session_id(token)
            request = cast("RequestLike", self.request)
            await self.application.create_session_if_needed(self.application_context, session_id, request, token)
            session = self.application_context.get_session(session_id)

            self.receiver = Receiver()
            self.connection = self.application.new_connection(self, session)
            log.info("ServerConnection created")

        except ProtocolError as e:
            log.error("Could not create new server session, reason: %s", e)
            self.close()
            raise e

        assert self.connection is not None
        msg = ack()
        await self.send_message(msg)

        return None

    async def on_message(self, message: str | bytes) -> None:
        ''' Process an individual wire protocol fragment.

        The websocket RFC specifies opcodes for distinguishing text frames
        from binary frames. Tornado passes us either a text or binary string
        depending on that opcode, we have to look at the type of the fragment
        to see what we got.

        Args:
            message (unicode or bytes) : wire message to process

        '''

        # We shouldn't throw exceptions from on_message because the caller is
        # just Tornado and it doesn't know what to do with them other than
        # report them as an unhandled Future

        try:
            parsed_message = await self._receive(message)
        except Exception as e:
            # If you go look at self._receive, it's catching the
            # expected error types... here we have something weird.
            log.error("Unhandled exception receiving a message: %r: %r", e, message, exc_info=True)
            self._internal_error("server failed to parse a message")
            parsed_message = None

        try:
            if parsed_message is not None:
                if _message_test_port is not None:
                    _message_test_port.received.append(parsed_message)
                assert self.connection is not None
                reply = await self.connection.handle(parsed_message)
                if reply is not None:
                    await self.send_message(reply)
        except ProtocolError as e:
            self._protocol_error(str(e))
        except Exception as e:
            log.error("Handler threw an exception: %r: %r", e, parsed_message, exc_info=True)
            self._internal_error("server failed to handle a message")

        return None

    async def send_message(self, message: Message[Any]) -> None:
        ''' Send a Bokeh Server protocol message to the connected client.

        Args:
            message (Message) : a message to send

        '''
        try:
            if _message_test_port is not None:
                _message_test_port.sent.append(message)
            with await self.write_lock.acquire():
                for fragment, binary in message.fragments():
                    await super().write_message(fragment, binary)
        except WebSocketClosedError:
            # on_close() is / will be called anyway
            log.warning("Failed sending message as connection was closed")
        return None

    def on_close(self) -> None:
        ''' Clean up when the connection is closed.

        '''
        log.info('WebSocket connection closed: code=%s, reason=%r', self.close_code, self.close_reason)
        if self.connection is not None:
            self.connection.session.notify_connection_lost()
            self.application.client_lost(self.connection)

    async def _receive(self, fragment: str | bytes) -> Message[Any] | None:
        # Receive fragments until a complete message is assembled
        try:
            assert self.receiver is not None
            message = self.receiver.consume(fragment)
            return message
        except ProtocolError as e:
            self._protocol_error(str(e))
            return None

    def _internal_error(self, message: str) -> None:
        log.error("Bokeh Server internal error: %s, closing connection", message)
        self.close(1011, message)

    def _protocol_error(self, message: str) -> None:
        log.error("Bokeh Server protocol error: %s, closing connection", message)
        self.close(1002, message)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

# This is an undocumented API purely for harvesting low level messages
# for testing. When needed it will be set by the testing machinery, and
# should not be used for any other purpose.
@dataclass
class MessageTestPort:
    sent: list[Message[Any]]
    received: list[Message[Any]]

_message_test_port: MessageTestPort | None = None

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
