#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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
import inspect
import threading
import weakref
from collections import deque
from functools import update_wrapper, wraps
from typing import (
    TYPE_CHECKING,
    Any,
    Awaitable,
    Callable,
    Literal,
    Protocol,
    cast,
)

## Bokeh imports
if TYPE_CHECKING:
    from ..application.application import SessionContext
    from ..server.callbacks import NextTickCallback
    from .document import Callback, Document

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'LockedCallback',
    'LockedCallbackPolicy',
    'UnlockedDocumentProxy',
    'without_document_lock',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

type LockedCallbackPolicy = Literal["every", "latest"]

type _Invocation = tuple[tuple[Any, ...], dict[str, Any]]


class LockedCallback[**P]:
    ''' A thread-safe callable that schedules work with a document lock held.

    Instances are normally created with :meth:`~bokeh.document.Document.locked_callback`
    instead of constructing them directly.

    Calls return immediately after scheduling the wrapped callback. With the
    ``"every"`` policy, all calls run in order. With the ``"latest"`` policy,
    at most one invocation waits to run: its arguments may be replaced before
    it starts, or while the current invocation is running.

    A locked callback is closed automatically when its server session is
    destroyed. It can also be closed explicitly with :meth:`close`.

    '''

    __annotations__: dict[str, Any]
    __name__: str
    __qualname__: str
    __wrapped__: Callable[P, Any]

    def __init__(self, document: Document, callback: Callable[P, Any], *, policy: LockedCallbackPolicy = "every") -> None:
        if policy not in ("every", "latest"):
            raise ValueError(f"unknown locked callback policy {policy!r}")

        session_context = document.session_context
        if session_context is None:
            raise RuntimeError("locked callbacks require a Bokeh server session")

        update_wrapper(self, callback)

        self._document_ref = weakref.ref(document)
        self._session_context_ref = weakref.ref(session_context)
        self._callback: Callable[P, Any] | None = callback
        self._policy: LockedCallbackPolicy = policy

        self._lock = threading.Lock()
        self._queue: deque[_Invocation] = deque()
        self._latest: _Invocation | None = None
        self._scheduled = False
        self._closed = False

        callback_ref = weakref.ref(self)

        def session_destroyed(session_context: SessionContext) -> None:
            if locked_callback := callback_ref():
                locked_callback.close()

        # Keep the lifecycle callback alive without making the Document keep
        # this wrapper (and its user callback) alive after an explicit close.
        self._session_destroyed_callback: Callable[[SessionContext], None] | None = session_destroyed
        document.on_session_destroyed(session_destroyed)

    @property
    def closed(self) -> bool:
        ''' Whether this callback will reject future invocations. '''
        with self._lock:
            return self._closed

    @property
    def pending(self) -> bool:
        ''' Whether an invocation is scheduled, running, or waiting to run. '''
        with self._lock:
            return self._scheduled

    @property
    def policy(self) -> LockedCallbackPolicy:
        ''' The policy used to handle calls that arrive while work is pending. '''
        return self._policy

    def __call__(self, *args: P.args, **kwargs: P.kwargs) -> None:
        ''' Schedule the wrapped callback and return immediately. '''
        if not self._is_active():
            self.close()
            return

        invocation: _Invocation = (args, kwargs)
        schedule = False
        with self._lock:
            if self._closed:
                return

            if self._policy == "every":
                self._queue.append(invocation)
            else:
                self._latest = invocation

            if not self._scheduled:
                self._scheduled = True
                schedule = True

        if schedule:
            self._schedule()

    def close(self) -> None:
        ''' Discard pending invocations and prevent future calls.

        An invocation that is already running is allowed to finish.

        '''
        with self._lock:
            if self._closed:
                return

            self._closed = True
            self._scheduled = False
            self._queue.clear()
            self._latest = None
            self._callback = None
            self._session_destroyed_callback = None
            self.__dict__.pop("__wrapped__", None)

    def _finish(self) -> None:
        schedule = False
        with self._lock:
            if self._closed:
                self._scheduled = False
            elif self._queue or self._latest is not None:
                schedule = True
            else:
                self._scheduled = False

        if schedule:
            self._schedule()

    def _invoke(self) -> Any:
        invocation = self._take_invocation()
        if invocation is None:
            self._finish()
            return None

        document = self._document_ref()
        if document is None:
            self.close()
            return None

        from ..io.doc import patch_curdoc

        callback, args, kwargs = invocation
        try:
            with patch_curdoc(document):
                result = callback(*args, **kwargs)
        except BaseException:
            self._finish()
            raise

        if inspect.isawaitable(result):
            return self._wait_for_result(result, document)

        self._finish()
        return result

    def _is_active(self) -> bool:
        document = self._document_ref()
        session_context = self._session_context_ref()
        return document is not None and session_context is not None and \
            document.session_context is session_context and not session_context.destroyed

    def _schedule(self) -> None:
        document = self._document_ref()
        if document is None or not self._is_active():
            self.close()
            return

        with self._lock:
            if self._closed or not self._scheduled:
                return

        try:
            document.add_next_tick_callback(self._invoke)
        except Exception:
            inactive = not self._is_active()
            self.close()
            if not inactive:
                raise

    def _take_invocation(self) -> tuple[Callable[P, Any], tuple[Any, ...], dict[str, Any]] | None:
        with self._lock:
            callback = self._callback
            if self._closed or callback is None:
                return None

            if self._policy == "every":
                if not self._queue:
                    return None
                args, kwargs = self._queue.popleft()
            else:
                if self._latest is None:
                    return None
                args, kwargs = self._latest
                self._latest = None

            return callback, args, kwargs

    async def _wait_for_result(self, result: Awaitable[Any], document: Document) -> Any:
        from ..io.doc import patch_curdoc

        try:
            with patch_curdoc(document):
                return await result
        finally:
            self._finish()


class NoLockCallback[F: Callable[..., Any]](Protocol):
    __call__: F
    nolock: Literal[True]

def without_document_lock[F: Callable[..., Any]](func: F) -> NoLockCallback[F]:
    ''' Wrap a callback function to execute without first obtaining the
    document lock.

    Args:
        func (callable) : The function to wrap

    Returns:
        callable : a function wrapped to execute without a |Document| lock.

    While inside an unlocked callback, it is completely *unsafe* to modify
    ``curdoc()``. The value of ``curdoc()`` inside the callback will be a
    specially wrapped version of |Document| that only allows safe operations,
    which are:

    * :func:`~bokeh.document.Document.add_next_tick_callback`
    * :func:`~bokeh.document.Document.remove_next_tick_callback`

    Only these may be used safely without taking the document lock. To make
    other changes to the document, you must add a next tick callback and make
    your changes to ``curdoc()`` from that second callback.

    Attempts to otherwise access or change the Document will result in an
    exception being raised.

    ``func`` can be a synchronous function, an async function, or a function
    decorated with ``asyncio.coroutine``. The returned function will be an
    async function if ``func`` is any of the latter two.

    '''
    if inspect.iscoroutinefunction(func):
        @wraps(func)
        async def _async_wrapper(*args: Any, **kw: Any) -> None:
            await func(*args, **kw)
        wrapper = cast(NoLockCallback[F], _async_wrapper)
    else:
        @wraps(func)
        def _sync_wrapper(*args: Any, **kw: Any) -> None:
            func(*args, **kw)
        wrapper = cast(NoLockCallback[F], _sync_wrapper)

    wrapper.nolock = True
    return wrapper


UNSAFE_DOC_ATTR_USAGE_MSG = (
    "Only 'add_next_tick_callback' may be used safely without taking the document lock; "
    "to make other changes to the document, add a next tick callback and make your changes "
    "from that callback."
)


class UnlockedDocumentProxy: # TODO(mypy): this needs to implement Document interface
    ''' Wrap a Document object so that only methods that can safely be used
    from unlocked callbacks or threads are exposed. Attempts to otherwise
    access or change the Document results in an exception.

    '''

    def __init__(self, doc: Document) -> None:
        '''

        '''
        self._doc = doc

    def __getattr__(self, attr: str) -> Any:
        '''

        '''
        raise AttributeError(UNSAFE_DOC_ATTR_USAGE_MSG)

    def add_next_tick_callback(self, callback: Callback) -> NextTickCallback:
        ''' Add a "next tick" callback.

        Args:
            callback (callable) :

        '''
        return self._doc.add_next_tick_callback(callback)

    def remove_next_tick_callback(self, callback: NextTickCallback) -> None:
        ''' Remove a "next tick" callback.

        Args:
            callback (callable) :

        '''
        self._doc.remove_next_tick_callback(callback)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
