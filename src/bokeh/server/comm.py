#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Serve Bokeh application sessions over message channels such as Jupyter comms.

A comm carries the same protocol messages as a Bokeh server websocket. Each
comm message holds one protocol message, ``{"kind": "bokeh", "envelope": ...}``,
with the message's binary buffers attached as comm buffers. Every comm gets its
own :class:`~bokeh.server.session.ServerSession`, created by a regular
:class:`~bokeh.server.contexts.ApplicationContext` from the application's
handlers, so callbacks, session lifecycle hooks and PATCH-DOC handling are the
same as for a Bokeh server.

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
import asyncio
import traceback
from collections.abc import Callable
from typing import TYPE_CHECKING, Any, Protocol

# Bokeh imports
from ..document.callbacks import invoke_with_curdoc
from ..events import ConnectionLost
from ..protocol import ack, error as error_message
from ..protocol.exceptions import ProtocolError
from ..protocol.receiver import Receiver
from ..util.serialization import make_globally_unique_id
from .connection import ServerConnection
from .contexts import ApplicationContext
from .session import ServerSession, _PendingPatch, _serialize_patches

if TYPE_CHECKING:
    from ..document.events import DocumentPatchedEvent
    from ..protocol.message import Message

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CommApplicationContext',
    'CommServerConnection',
    'CommServerSession',
    'CommSessionEndpoint',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Comm(Protocol):
    ''' The parts of an ``ipykernel`` comm used by a session endpoint. '''

    def send(self, data: Any = None, buffers: list[bytes] | None = None) -> None: ...

    def on_msg(self, callback: Callable[[dict[str, Any]], None]) -> None: ...

    def on_close(self, callback: Callable[[Any], None]) -> None: ...

    def close(self) -> None: ...


class CommServerSession(ServerSession):
    ''' A server session whose document may also be changed outside callbacks.

    Notebook code may change a session document directly, for example from a
    later cell. Kernel code runs on the thread of the kernel's event loop, as
    session callbacks do, so such changes are sent to the view immediately
    instead of requiring ``doc.add_next_tick_callback()``.

    '''

    def _document_patched(self, event: DocumentPatchedEvent) -> None:
        if self._pending_writes is not None:
            super()._document_patched(event)
            return
        with self._connections_lock:
            connections = tuple(self._subscribed_connections)
        if not connections:
            return
        for message, targets in _serialize_patches([_PendingPatch(event, connections)]):
            for connection in targets:
                if isinstance(connection, CommServerConnection):
                    connection.send_now(message)


class CommApplicationContext(ApplicationContext):
    ''' An application context whose sessions are served over comms. '''

    session_type = CommServerSession


class CommServerConnection(ServerConnection):
    ''' A server connection to one comm. '''

    _transport: _CommTransport

    def send_now(self, message: Message[Any]) -> None:
        ''' Send a message synchronously. '''
        self._transport.send(message)

    def _error_reply(self, message: Message[Any], error: Exception) -> Message[Any]:
        # A comm connects the kernel's own user to the session, so callback
        # errors are reported in full, as Python would print them in a cell.
        text = "".join(traceback.format_exception_only(error)).strip()
        return error_message(message.header["msgid"], text, traceback="".join(traceback.format_exception(error)))


class CommSessionEndpoint:
    ''' Serve one new application session to one comm.

    The endpoint creates a session as soon as it is constructed and reports it
    with a ``{"kind": "session", ...}`` message. Session creation errors,
    including errors raised by application handlers, are reported with a
    ``{"kind": "error", ...}`` message before the comm is closed. When the
    frontend sends ``{"kind": "connect"}``, the endpoint subscribes a
    connection to the session and acknowledges it, just like a websocket that
    opens. Bokeh protocol messages are then handled in the order received.

    Args:
        context:
            The application context that creates the session.
        comm:
            The comm to serve the session to.
        describe:
            Returns extra fields of the ``session`` message for a new session.
        on_close:
            Called once after the endpoint closes.

    '''

    def __init__(self, context: ApplicationContext, comm: Comm, *,
            describe: Callable[[ServerSession], dict[str, Any]] | None = None,
            on_close: Callable[[CommSessionEndpoint], None] | None = None) -> None:
        self._context = context
        self._comm = comm
        self._describe = describe
        self._on_close = on_close
        self._session: ServerSession | None = None
        self._connection: CommServerConnection | None = None
        self._receiver = Receiver()
        self._queue: asyncio.Queue[tuple[dict[str, Any], list[bytes]] | None] = asyncio.Queue()
        self._closed = False
        comm.on_msg(self._receive)
        comm.on_close(lambda _message: self._shutdown())
        self._task = asyncio.get_running_loop().create_task(self._run())

    @property
    def closed(self) -> bool:
        ''' Whether the endpoint has closed. '''
        return self._closed

    @property
    def session(self) -> ServerSession | None:
        ''' The session served by this endpoint, once it was created. '''
        return self._session

    @property
    def task(self) -> asyncio.Task[None]:
        ''' The task that serves the session and finishes after it was discarded. '''
        return self._task

    def close(self) -> None:
        ''' Close the comm and discard the session. '''
        if self._closed:
            return
        try:
            self._comm.send({"kind": "close"})
            self._comm.close()
        except Exception:
            log.debug("Could not close a session comm", exc_info=True)
        self._shutdown()

    def _receive(self, message: dict[str, Any]) -> None:
        if self._closed:
            return
        data = message.get("content", {}).get("data", {})
        buffers = [bytes(buffer) for buffer in message.get("buffers") or ()]
        if isinstance(data, dict):
            self._queue.put_nowait((data, buffers))

    def _shutdown(self) -> None:
        if self._closed:
            return
        self._closed = True
        self._queue.put_nowait(None)

    def _fail(self, code: str, error: BaseException) -> None:
        if not self._closed:
            try:
                self._comm.send({
                    "kind": "error",
                    "code": code,
                    "message": "".join(traceback.format_exception_only(error)).strip(),
                    "traceback": "".join(traceback.format_exception(error)),
                })
                self._comm.close()
            except Exception:
                log.debug("Could not report a session error", exc_info=True)
        self._shutdown()

    async def _run(self) -> None:
        try:
            session = await self._context.create_session_if_needed(make_globally_unique_id())
        except Exception as error:
            self._fail("APPLICATION_SESSION_FAILED", error)
            self._finished()
            return
        self._session = session
        try:
            failed = [handler for handler in self._context.application.handlers if handler.failed]
            if failed:
                raise RuntimeError("\n".join(f"{handler.error}\n{handler.error_detail or ''}" for handler in failed))
            if not self._closed:
                self._comm.send({"kind": "session", **(self._describe(session) if self._describe else {})})
        except Exception as error:
            self._fail("APPLICATION_SESSION_FAILED", error)

        while (item := await self._queue.get()) is not None:
            data, buffers = item
            try:
                await self._handle(session, data, buffers)
            except ProtocolError as error:
                log.error("Bokeh comm protocol error: %s, closing comm", error)
                self._fail("PROTOCOL_ERROR", error)
            except Exception as error:
                log.error("Bokeh comm session failed to handle a message", exc_info=True)
                self._fail("SESSION_ERROR", error)

        try:
            await self._discard(session)
        finally:
            self._finished()

    async def _handle(self, session: ServerSession, data: dict[str, Any], buffers: list[bytes]) -> None:
        kind = data.get("kind")
        if kind == "connect":
            if self._connection is None:
                self._connection = CommServerConnection(_CommTransport(self._comm), session)
            self._connection.send_now(ack())
        elif kind == "bokeh":
            if self._connection is None:
                raise ProtocolError("received a Bokeh message before connecting")
            envelope = data.get("envelope")
            if not isinstance(envelope, str):
                raise ProtocolError("Bokeh comm messages must carry a string envelope")
            message = self._receiver.consume(envelope)
            for buffer in buffers:
                message = self._receiver.consume(buffer)
            if message is None:
                raise ProtocolError("Bokeh comm message is missing binary buffers")
            reply = await self._connection.handle(message)
            if reply is not None and not self._closed:
                self._connection.send_now(reply)

    async def _discard(self, session: ServerSession) -> None:
        connection = self._connection
        self._connection = None
        if connection is not None:
            connection.detach_session()
        if session.destroyed:
            return

        def notify() -> None:
            invoke_with_curdoc(session.document, lambda: session.document.callbacks.trigger_event(ConnectionLost()))

        try:
            if connection is not None:
                await session.with_document_locked(notify)
        except Exception:
            log.error("Failed to notify a comm session of its lost connection", exc_info=True)
        session._stop_callbacks()
        await self._context._discard_session(session, lambda session: session.connection_count == 0)

    def _finished(self) -> None:
        if self._on_close is not None:
            on_close, self._on_close = self._on_close, None
            on_close(self)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class _CommTransport:

    def __init__(self, comm: Comm) -> None:
        self._comm = comm

    def send(self, message: Message[Any]) -> None:
        self._comm.send(
            {"kind": "bokeh", "envelope": message.envelope_json},
            buffers=[buffer.to_bytes() for buffer in message.buffers],
        )

    async def send_message(self, message: Message[Any]) -> None:
        self.send(message)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
