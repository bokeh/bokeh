#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a web socket handler for the Bokeh Server application.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import calendar
import codecs
import datetime as dt
from urllib.parse import urlparse

# External imports
from tornado import locks, web
from tornado.websocket import WebSocketClosedError, WebSocketHandler

# Bokeh imports
from bokeh.settings import settings
from bokeh.util.token import check_token_signature, get_session_id, get_token_payload

# Bokeh imports
from ...protocol import Protocol
from ...protocol.exceptions import MessageError, ProtocolError, ValidationError
from ...protocol.message import Message
from ...protocol.receiver import Receiver
from ..protocol_handler import ProtocolHandler
from .auth_mixin import AuthMixin

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

class WSHandler(AuthMixin, WebSocketHandler):
    ''' Implements a custom Tornado WebSocketHandler for the Bokeh Server.

    '''
    def __init__(self, tornado_app, *args, **kw):
        self.receiver = None
        self.handler = None
        self.connection = None
        self.application_context = kw['application_context']
        self.latest_pong = -1
        # write_lock allows us to lock the connection to send multiple
        # messages atomically.
        self.write_lock = locks.Lock()

        self._token = None

        self._compression_level = kw.pop('compression_level', None)
        self._mem_level = kw.pop('mem_level', None)

        # Note: tornado_app is stored as self.application
        super().__init__(tornado_app, *args, **kw)

    def initialize(self, application_context, bokeh_websocket_path):
        pass

    def check_origin(self, origin):
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

        allowed = check_allowlist(origin_host, allowed_hosts)
        if allowed:
            return True
        else:
            log.error("Refusing websocket connection from Origin '%s'; \
                      use --allow-websocket-origin=%s or set BOKEH_ALLOW_WS_ORIGIN=%s to permit this; currently we allow origins %r",
                      origin, origin_host, origin_host, allowed_hosts)
            return False

    @web.authenticated
    def open(self):
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

        now = calendar.timegm(dt.datetime.utcnow().utctimetuple())
        payload = get_token_payload(token)
        if 'session_expiry' not in payload:
            self.close()
            raise ProtocolError("Session expiry has not been provided")
        elif now >= payload['session_expiry']:
            self.close()
            raise ProtocolError("Token is expired.")
        elif not check_token_signature(token,
                                       signed=self.application.sign_sessions,
                                       secret_key=self.application.secret_key):
            session_id = get_session_id(token)
            log.error("Token for session %r had invalid signature", session_id)
            raise ProtocolError("Invalid token signature")

        try:
            self.application.io_loop.spawn_callback(self._async_open, self._token)
        except Exception as e:
            # this isn't really an error (unless we have a
            # bug), it just means a client disconnected
            # immediately, most likely.
            log.debug("Failed to fully open connection %r", e)

    def select_subprotocol(self, subprotocols):
        log.debug('Subprotocol header received')
        log.trace('Supplied subprotocol headers: %r', subprotocols)
        if not len(subprotocols) == 2:
            return None
        self._token = subprotocols[1]
        return subprotocols[0]

    def get_compression_options(self):
        if self._compression_level is None:
            return None
        options = {'compression_level': self._compression_level}
        if self._mem_level is not None:
            options['mem_level'] = self._mem_level
        return options

    async def _async_open(self, token):
        ''' Perform the specific steps needed to open a connection to a Bokeh session

        Specifically, this method coordinates:

        * Getting a session for a session ID (creating a new one if needed)
        * Creating a protocol receiver and handler
        * Opening a new ServerConnection and sending it an ACK

        Args:
            session_id (str) :
                A session ID to for a session to connect to

                If no session exists with the given ID, a new session is made

        Returns:
            None

        '''
        try:
            session_id = get_session_id(token)
            await self.application_context.create_session_if_needed(session_id, self.request, token)
            session = self.application_context.get_session(session_id)

            protocol = Protocol()
            self.receiver = Receiver(protocol)
            log.debug("Receiver created for %r", protocol)

            self.handler = ProtocolHandler()
            log.debug("ProtocolHandler created for %r", protocol)

            self.connection = self.application.new_connection(protocol, self, self.application_context, session)
            log.info("ServerConnection created")

        except ProtocolError as e:
            log.error("Could not create new server session, reason: %s", e)
            self.close()
            raise e

        msg = self.connection.protocol.create('ACK')
        await self.send_message(msg)

        return None

    async def on_message(self, fragment):
        ''' Process an individual wire protocol fragment.

        The websocket RFC specifies opcodes for distinguishing text frames
        from binary frames. Tornado passes us either a text or binary string
        depending on that opcode, we have to look at the type of the fragment
        to see what we got.

        Args:
            fragment (unicode or bytes) : wire fragment to process

        '''

        # We shouldn't throw exceptions from on_message because the caller is
        # just Tornado and it doesn't know what to do with them other than
        # report them as an unhandled Future

        try:
            message = await self._receive(fragment)
        except Exception as e:
            # If you go look at self._receive, it's catching the
            # expected error types... here we have something weird.
            log.error("Unhandled exception receiving a message: %r: %r", e, fragment, exc_info=True)
            self._internal_error("server failed to parse a message")

        try:
            if message:
                if _message_test_port is not None:
                    _message_test_port.received.append(message)
                work = await self._handle(message)
                if work:
                    await self._schedule(work)
        except Exception as e:
            log.error("Handler or its work threw an exception: %r: %r", e, message, exc_info=True)
            self._internal_error("server failed to handle a message")

        return None

    def on_pong(self, data):
        # if we get an invalid integer or utf-8 back, either we
        # sent a buggy ping or the client is evil/broken.
        try:
            self.latest_pong = int(codecs.decode(data, 'utf-8'))
        except UnicodeDecodeError:
            log.trace("received invalid unicode in pong %r", data, exc_info=True)
        except ValueError:
            log.trace("received invalid integer in pong %r", data, exc_info=True)

    async def send_message(self, message):
        ''' Send a Bokeh Server protocol message to the connected client.

        Args:
            message (Message) : a message to send

        '''
        try:
            if _message_test_port is not None:
                _message_test_port.sent.append(message)
            await message.send(self)
        except WebSocketClosedError:
            # on_close() is / will be called anyway
            log.warning("Failed sending message as connection was closed")
        return None

    async def write_message(self, message, binary=False, locked=True):
        ''' Override parent write_message with a version that acquires a
        write lock before writing.

        '''
        if locked:
            with await self.write_lock.acquire():
                await super().write_message(message, binary)
        else:
            await super().write_message(message, binary)

    def on_close(self):
        ''' Clean up when the connection is closed.

        '''
        log.info('WebSocket connection closed: code=%s, reason=%r', self.close_code, self.close_reason)
        if self.connection is not None:
            self.application.client_lost(self.connection)

    async def _receive(self, fragment):
        # Receive fragments until a complete message is assembled
        try:
            message = await self.receiver.consume(fragment)
            return message
        except (MessageError, ProtocolError, ValidationError) as e:
            self._protocol_error(str(e))
            return None

    async def _handle(self, message):
        # Handle the message, possibly resulting in work to do
        try:
            work = await self.handler.handle(message, self.connection)
            return work
        except (MessageError, ProtocolError, ValidationError) as e: # TODO (other exceptions?)
            self._internal_error(str(e))
            return None

    async def _schedule(self, work):
        if isinstance(work, Message):
            await self.send_message(work)
        else:
            self._internal_error("expected a Message not " + repr(work))

        return None

    def _internal_error(self, message):
        log.error("Bokeh Server internal error: %s, closing connection", message)
        self.close(10000, message)

    def _protocol_error(self, message):
        log.error("Bokeh Server protocol error: %s, closing connection", message)
        self.close(10001, message)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

# This is an undocumented API purely for harvesting low level messages
# for testing. When needed it will be set by the testing machinery, and
# should not be used for any other purpose.
_message_test_port = None

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
