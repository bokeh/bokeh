''' Provides the ``ServerSession`` class.

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from tornado import gen, locks
from bokeh.document import SessionCallbackAdded, SessionCallbackRemoved, PeriodicCallback, TimeoutCallback

import time

def current_time():
    try:
        # python >=3.3 only
        return time.monotonic()
    except:
        # if your python is old, don't set your clock backward!
        return time.time()

def _needs_document_lock(func):
    '''Decorator that adds the necessary locking and post-processing
       to manipulate the session's document. Expects to decorate a
       non-coroutine method on ServerSession and transforms it
       into a coroutine.
    '''
    @gen.coroutine
    def _needs_document_lock_wrapper(self, *args, **kwargs):
        with (yield self._lock.acquire()):
            if self._pending_writes is not None:
                raise RuntimeError("internal class invariant violated: _pending_writes should be None if lock is not held")
            self._pending_writes = []
            result = func(self, *args, **kwargs)
            pending_writes = self._pending_writes
            self._pending_writes = None
            for p in pending_writes:
                yield p
        raise gen.Return(result)
    return _needs_document_lock_wrapper

class _AsyncPeriodic(object):
    """Like ioloop.PeriodicCallback except the 'func' is async and
        returns a Future, and we wait for func to finish each time
        before we call it again.  Plain ioloop.PeriodicCallback
        can "pile up" invocations if they are taking too long.

    """
    def __init__(self, func, period, io_loop):
        self._func = func
        self._loop = io_loop
        self._period = period
        self._handle = None
        self._last_start_time = None

    def _step(self):
        ''' Invoke async _func() and re-schedule next invocation '''
        future = self._func()
        def on_done(future):
            now = self._loop.time()
            duration = now - self._last_start_time
            self._last_start_time = now
            next_period = max(self._period - duration, 0)
            self._handle = self._loop.call_later(next_period, self._step)
            if future.exception() is not None:
                log.error("Error thrown from periodic callback: %r", future.exception())
        self._loop.add_future(future, on_done)

    def start(self):
        self._last_start_time = self._loop.time()
        self._handle = self._loop.call_later(self._period, self._step)

    def stop(self):
        if self._handle is not None:
            self._loop.remove_timeout(self._handle)
            self._handle = None

class ServerSession(object):
    ''' Hosts an application "instance" (an instantiated Document) for one or more connections.

    '''

    def __init__(self, session_id, document, io_loop=None):
        if session_id is None:
            raise ValueError("Sessions must have an id")
        if document is None:
            raise ValueError("Sessions must have a document")
        self._id = session_id
        self._document = document
        self._loop = io_loop
        self._subscribed_connections = set()
        self._last_unsubscribe_time = current_time()
        self._lock = locks.Lock()
        self._current_patch = None
        self._current_patch_connection = None
        self._document.on_change(self._document_changed)
        self._callbacks = {}
        self._pending_writes = None

        for cb in self._document.session_callbacks:
            if isinstance(cb, PeriodicCallback):
                self._add_periodic_callback(cb)
            elif isinstance(cb, TimeoutCallback):
                self._add_timeout_callback(cb)

    @property
    def document(self):
        return self._document

    @property
    def id(self):
        return self._id

    def subscribe(self, connection):
        """This should only be called by ServerConnection.subscribe_session or our book-keeping will be broken"""
        self._subscribed_connections.add(connection)

    def unsubscribe(self, connection):
        """This should only be called by ServerConnection.unsubscribe_session or our book-keeping will be broken"""
        self._subscribed_connections.discard(connection)
        self._last_unsubscribe_time = current_time()

    @property
    def connection_count(self):
        return len(self._subscribed_connections)

    @property
    def seconds_since_last_unsubscribe(self):
        return current_time() - self._last_unsubscribe_time

    @_needs_document_lock
    def with_document_locked(self, func, *args, **kwargs):
        ''' Asynchronously locks the document and runs the function with it locked.'''
        return func(*args, **kwargs)

    def _wrap_document_callback(self, callback):
        def wrapped_callback(*args, **kwargs):
            return self.with_document_locked(callback, *args, **kwargs)
        return wrapped_callback

    def _add_periodic_callback(self, callback):
        ''' Add callback so it can be invoked on a session periodically accordingly to period.

        NOTE: periodic callbacks can only work within a session. It'll take no effect when bokeh output is html or notebook

        '''
        cb = self._callbacks[callback.id] = _AsyncPeriodic(
            self._wrap_document_callback(callback.callback), callback.period, io_loop=self._loop
        )
        cb.start()

    def _remove_periodic_callback(self, callback):
        ''' Remove a callback added earlier with add_periodic_callback()

            Throws an error if the callback wasn't added

        '''
        self._callbacks.pop(callback.id).stop()

    def _add_timeout_callback(self, callback):
        ''' Add callback so it can be invoked on a session after timeout

        NOTE: timeout callbacks can only work within a session. It'll take no effect when bokeh output is html or notebook

        '''
        cb = self._loop.call_later(callback.timeout, self._wrap_document_callback(callback.callback))
        self._callbacks[callback.id] = cb

    def _remove_timeout_callback(self, callback):
        ''' Remove a callback added earlier with _add_timeout_callback()

            Throws an error if the callback wasn't added

        '''
        cb = self._callbacks.pop(callback.id)
        self._loop.remove_timeout(cb)

    def _document_changed(self, event):
        may_suppress = self._current_patch is not None and \
                       self._current_patch.should_suppress_on_change(event)

        if isinstance(event, SessionCallbackAdded):
            if isinstance(event.callback, PeriodicCallback):
                self._add_periodic_callback(event.callback)
            elif isinstance(event.callback, TimeoutCallback):
                self._add_timeout_callback(event.callback)
            else:
                raise ValueError("Expected callback of type PeriodicCallback or TimeoutCallback, got: %s" % event.callback)

            return

        elif isinstance(event, SessionCallbackRemoved):
            if isinstance(event.callback, PeriodicCallback):
                self._remove_periodic_callback(event.callback)
            elif isinstance(event.callback, TimeoutCallback):
                self._remove_timeout_callback(event.callback)
            else:
                raise ValueError("Expected callback of type PeriodicCallback or TimeoutCallback, got: %s" % event.callback)

            return

        if self._pending_writes is None:
            raise RuntimeError("_pending_writes should be non-None when we have a document lock, and we should have the lock when the document changes")

        # TODO (havocp): our "change sync" protocol is flawed
        # because if both sides change the same attribute at the
        # same time, they will each end up with the state of the
        # other and their final states will differ.
        for connection in self._subscribed_connections:
            if may_suppress and connection is self._current_patch_connection:
                pass #log.debug("Not sending notification back to client %r for a change it requested", connection)
            else:
                self._pending_writes.append(connection.send_patch_document(event))

    @_needs_document_lock
    def _handle_pull(self, message, connection):
        log.debug("Sending pull-doc-reply from session %r", self.id)
        return connection.protocol.create('PULL-DOC-REPLY', message.header['msgid'], self.document)

    @classmethod
    def pull(cls, message, connection):
        ''' Handle a PULL-DOC, return a Future with work to be scheduled. '''
        return connection.session._handle_pull(message, connection)

    @_needs_document_lock
    def _handle_push(self, message, connection):
        log.debug("pushing doc to session %r", self.id)
        message.push_to_document(self.document)
        return connection.ok(message)

    @classmethod
    def push(cls, message, connection):
        ''' Handle a PUSH-DOC, return a Future with work to be scheduled. '''
        return connection.session._handle_push(message, connection)

    @_needs_document_lock
    def _handle_patch(self, message, connection):
        self._current_patch = message
        self._current_patch_connection = connection
        try:
            message.apply_to_document(self.document)
        finally:
            self._current_patch = None
            self._current_patch_connection = None

        return connection.ok(message)

    @classmethod
    def patch(cls, message, connection):
        ''' Handle a PATCH-DOC, return a Future with work to be scheduled. '''
        return connection.session._handle_patch(message, connection)
