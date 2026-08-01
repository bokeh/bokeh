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
import asyncio
import inspect
import threading
import time
from copy import copy
from dataclasses import dataclass
from functools import partial, wraps
from typing import (
    TYPE_CHECKING,
    Any,
    Awaitable,
    Callable,
    cast,
)

# Bokeh imports
from ..document.callbacks import invoke_with_curdoc
from ..events import ConnectionLost
from ..io.doc import patch_curdoc
from ..protocol import apply_patch, patch_doc, pull_doc_reply, replace_document
from ..util.asyncio import Loop, _asyncio_loop
from ..util.token import generate_jwt_token
from ..util.tornado import _run_in_executor
from .callbacks import DocumentCallbackGroup
from .executor import _await_cancellation_safe

if TYPE_CHECKING:
    from ..core.types import ID
    from ..document.document import Document
    from ..document.events import (
        DocumentPatchedEvent,
        SessionCallbackAdded,
        SessionCallbackRemoved,
    )
    from ..protocol import messages as msg
    from ..protocol.message import Message
    from .callbacks import Callback, SessionCallback
    from .connection import ServerConnection
    from .executor import _ServerExecutor

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'current_time',
    'ServerSession',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

@dataclass(frozen=True)
class _PendingPatch:
    event: DocumentPatchedEvent
    connections: tuple[ServerConnection, ...]

def _serialize_patches(pending: list[_PendingPatch]) -> list[tuple[Message[Any], tuple[ServerConnection, ...]]]:
    messages: list[tuple[Message[Any], tuple[ServerConnection, ...]]] = []
    for patch in pending:
        with patch_curdoc(patch.event.document):
            message = patch_doc([patch.event])
            message.prepare()
        messages.append((message, patch.connections))
    return messages

def _serialize_pull_reply(request_id: ID, document: Document) -> Message[Any]:
    with patch_curdoc(document):
        message = pull_doc_reply(request_id, document)
        message.prepare()
    return message

def _log_connection_lost_error(task: asyncio.Task[Any]) -> None:
    if not task.cancelled() and (error := task.exception()) is not None:
        log.error("Failed to notify connection loss: %s", error, exc_info=error)

def _needs_document_lock[**P](
    func: Callable[P, Any],
    *,
    offload: bool = True,
) -> Callable[P, Awaitable[Any]]:
    '''Decorator that adds the necessary locking and post-processing
       to manipulate the session's document. Expects to decorate a
       method on ServerSession and transforms it into a coroutine
       if it wasn't already.
    '''
    @wraps(func)
    async def _needs_document_lock_wrapper(self: ServerSession, *args: Any, **kwargs: Any) -> Any:
        # while we wait for and hold the lock, prevent the session
        # from being discarded. This avoids potential weirdness
        # with the session vanishing in the middle of some async
        # task.
        if self.destroyed:
            log.debug("Ignoring locked callback on already-destroyed session.")
            return None
        self.block_expiration()
        try:
            async with self._lock:
                if self._pending_writes is not None:
                    raise RuntimeError("internal class invariant violated: _pending_writes " + \
                                       "should be None if lock is not held")
                self._pending_writes = []
                error: BaseException | None = None
                result: Any = None
                try:
                    callback = cast(Callable[..., Any], func)
                    if offload:
                        result = await _run_in_executor(callback, self, *args, **kwargs)
                    else:
                        result = callback(self, *args, **kwargs)
                    if inspect.isawaitable(result):
                        # Async callbacks continue on the event loop while
                        # retaining the document lock across awaits.
                        result = await result
                except BaseException as callback_error:
                    error = callback_error
                finally:
                    pending_writes = self._pending_writes
                    self._pending_writes = None
                try:
                    # Finish response generation and writes before releasing
                    # the document lock, even if the callback was cancelled.
                    if pending_writes:
                        await _await_cancellation_safe(self._send_pending_patches(pending_writes))
                except BaseException as write_error:
                    if error is None:
                        error = write_error
                if error is not None:
                    raise error
            return result
        finally:
            self.unblock_expiration()
    return cast(Callable[P, Awaitable[Any]], _needs_document_lock_wrapper)

def _needs_document_lock_on_loop[**P](
    func: Callable[P, Any],
) -> Callable[P, Awaitable[Any]]:
    return _needs_document_lock(func, offload=False)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def current_time() -> float:
    '''Return the time in milliseconds since the epoch as a floating
       point number.
    '''
    return time.monotonic() * 1000

class ServerSession:
    ''' Hosts an application "instance" (an instantiated Document) for one or more connections.

    '''

    _subscribed_connections: set[ServerConnection]
    _current_patch_connection: ServerConnection | None
    _pending_writes: list[_PendingPatch] | None

    def __init__(self, session_id: ID, document: Document, io_loop: Loop | None = None,
            token: str | None = None, executor: _ServerExecutor | None = None) -> None:
        if session_id is None:
            raise ValueError("Sessions must have an id")
        if document is None:
            raise ValueError("Sessions must have a document")
        self._id = session_id
        self._token = token
        self._document = document
        self._loop = io_loop
        self._executor = executor
        self._subscribed_connections = set()
        self._connections_lock = threading.Lock()
        self._last_unsubscribe_time = current_time()
        self._lock = asyncio.Lock()
        self._current_patch_connection = None
        self._document.callbacks.on_change_dispatch_to(self)
        self._callbacks = DocumentCallbackGroup(cast(Any, io_loop))
        self._pending_writes = None
        self._destroyed = False
        self._expiration_requested = False
        self._expiration_blocked_count = 0

        wrapped_callbacks = [self._wrap_session_callback(cb) for cb in self._document.session_callbacks]
        self._callbacks.add_session_callbacks(wrapped_callbacks)

    @property
    def document(self) -> Document:
        return self._document

    @property
    def id(self) -> ID:
        return self._id

    @property
    def token(self) -> str:
        ''' A JWT token to authenticate the session. '''
        if self._token:
            return self._token
        return generate_jwt_token(self.id)

    @property
    def destroyed(self) -> bool:
        return self._destroyed

    @property
    def expiration_requested(self) -> bool:
        return self._expiration_requested

    @property
    def expiration_blocked(self) -> bool:
        return self._expiration_blocked_count > 0

    @property
    def expiration_blocked_count(self) -> int:
        return self._expiration_blocked_count

    def destroy(self) -> None:
        self._destroyed = True

        self._document.destroy(self)
        del self._document

        self._callbacks.remove_all_callbacks()
        del self._callbacks

    def _stop_callbacks(self) -> None:
        """Prevent new document callbacks while orderly shutdown takes the lock."""
        self._callbacks.remove_all_callbacks()

    def request_expiration(self) -> None:
        """ Used in test suite for now. Forces immediate expiration if no connections."""
        self._expiration_requested = True

    def block_expiration(self) -> None:
        self._expiration_blocked_count += 1

    def unblock_expiration(self) -> None:
        if self._expiration_blocked_count <= 0:
            raise RuntimeError("mismatched block_expiration / unblock_expiration")
        self._expiration_blocked_count -= 1

    def subscribe(self, connection: ServerConnection) -> None:
        """This should only be called by ``ServerConnection.subscribe_session`` or our book-keeping will be broken"""
        with self._connections_lock:
            self._subscribed_connections.add(connection)

    def unsubscribe(self, connection: ServerConnection) -> None:
        """This should only be called by ``ServerConnection.unsubscribe_session`` or our book-keeping will be broken"""
        with self._connections_lock:
            self._subscribed_connections.discard(connection)
            self._last_unsubscribe_time = current_time()

    @property
    def connection_count(self) -> int:
        with self._connections_lock:
            return len(self._subscribed_connections)

    @property
    def milliseconds_since_last_unsubscribe(self) -> float:
        with self._connections_lock:
            return current_time() - self._last_unsubscribe_time

    @_needs_document_lock
    def with_document_locked[T](self, func: Callable[..., T], *args: Any, **kwargs: Any) -> T:
        ''' Asynchronously locks the document and runs the function with it locked.'''
        return func(*args, **kwargs)

    def _wrap_document_callback(self, callback: Callback) -> Callback:
        if getattr(callback, "nolock", False):
            @wraps(callback)
            async def unlocked_callback(*args: Any, **kwargs: Any) -> Any:
                result = await _run_in_executor(callback, *args, **kwargs)
                if inspect.isawaitable(result):
                    await result
                return None
            return unlocked_callback
        def locked_callback(*args: Any, **kwargs: Any) -> Any:
            return self.with_document_locked(callback, *args, **kwargs)
        return locked_callback

    def _wrap_session_callback(self, callback: SessionCallback) -> SessionCallback:
        wrapped = copy(callback)
        wrapped._callback = self._wrap_document_callback(callback.callback)
        return wrapped

    def _document_patched(self, event: DocumentPatchedEvent) -> None:
        may_suppress = event.setter is self

        if self._pending_writes is None:
            raise RuntimeError("_pending_writes should be non-None when we have a document lock, and we should have the lock when the document changes")

        # TODO (havocp): our "change sync" protocol is flawed because if both
        # sides change the same attribute at the same time, they will each end
        # up with the state of the other and their final states will differ.
        with self._connections_lock:
            connections = tuple(
                connection for connection in self._subscribed_connections
                if not may_suppress or connection is not self._current_patch_connection
            )
        if connections:
            self._pending_writes.append(_PendingPatch(event, connections))

    async def _run_in_executor[T](self, func: Callable[..., T], *args: Any) -> T:
        if self._executor is not None:
            return await self._executor.run(func, *args)

        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, partial(func, *args))

    async def _send_pending_patches(self, pending: list[_PendingPatch]) -> None:
        messages = await self._run_in_executor(_serialize_patches, pending)
        for message, connections in messages:
            for connection in connections:
                await connection.send_message(message)

    @_needs_document_lock_on_loop
    async def _handle_pull(self, message: msg.PullDocReq, connection: ServerConnection) -> None:
        log.debug(f"Sending pull-doc-reply from session {self.id!r}")
        async def send_reply() -> None:
            reply = await self._run_in_executor(
                _serialize_pull_reply,
                message.header["msgid"],
                self.document,
            )
            await connection.send_message(reply)

        await _await_cancellation_safe(send_reply())

    def _session_callback_added(self, event: SessionCallbackAdded) -> None:
        wrapped = self._wrap_session_callback(event.callback)
        self._callbacks.add_session_callback(wrapped)

    def _session_callback_removed(self, event: SessionCallbackRemoved) -> None:
        self._callbacks.remove_session_callback(event.callback)

    @_needs_document_lock_on_loop
    async def _handle_push(self, message: msg.PushDocMessage, connection: ServerConnection) -> msg.Ok:
        log.debug(f"pushing doc to session {self.id!r}")
        await _run_in_executor(replace_document, message, self.document)
        return connection.ok(message)

    @_needs_document_lock_on_loop
    async def _handle_patch(self, message: msg.PatchDoc, connection: ServerConnection) -> msg.Ok:
        self._current_patch_connection = connection
        try:
            await _run_in_executor(apply_patch, message, self.document, self)
        finally:
            self._current_patch_connection = None

        return connection.ok(message)

    def notify_connection_lost(self) -> None:
        ''' Notify the document that the connection was lost. '''
        event = ConnectionLost()

        def notify() -> None:
            invoke_with_curdoc(self.document,
                               lambda: self.document.callbacks.trigger_event(event))

        assert self._loop is not None
        loop = _asyncio_loop(self._loop)

        async def notify_locked() -> None:
            await self.with_document_locked(notify)

        def schedule() -> None:
            task = loop.create_task(notify_locked())
            task.add_done_callback(_log_connection_lost_error)

        loop.call_soon_threadsafe(schedule)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
