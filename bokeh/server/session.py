''' Provides the ``ServerSession`` class.

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from tornado import gen, locks
from bokeh.document import PeriodicCallbackAdded, PeriodicCallbackRemoved

import time

def current_time():
    try:
        # python >=3.3 only
        return time.monotonic()
    except:
        # if your python is old, don't set your clock backward!
        return time.time()

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

        for cb in self._document.session_callbacks:
            self.add_periodic_callback(cb)

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

    def add_periodic_callback(self, callback):
        ''' Add callback so it can be invoked on a session periodically accordingly to period.

        NOTE: periodic callbacks can only work within a session. It'll take no effect when bokeh output is html or notebook

        '''
        from tornado import ioloop
        cb = self._callbacks[callback.id] = ioloop.PeriodicCallback(
            callback.callback, callback.period, io_loop=self._loop
        )
        cb.start()

    def remove_periodic_callback(self, callback):
        ''' Remove a callback added earlier with add_periodic_callback()

            Throws an error if the callback wasn't added

        '''
        self._callbacks.pop(callback.id).stop()

    def _document_changed(self, event):
        may_suppress = self._current_patch is not None and \
                       self._current_patch.should_suppress_on_change(event)

        if isinstance(event, PeriodicCallbackAdded):
            self.add_periodic_callback(event.callback)
            return

        if isinstance(event, PeriodicCallbackRemoved):
            self.remove_periodic_callback(event.callback)
            return

        # TODO (havocp): our "change sync" protocol is flawed
        # because if both sides change the same attribute at the
        # same time, they will each end up with the state of the
        # other and their final states will differ.
        for connection in self._subscribed_connections:
            if may_suppress and connection is self._current_patch_connection:
                pass #log.debug("Not sending notification back to client %r for a change it requested", connection)
            else:
                connection.send_patch_document(event)

    @classmethod
    @gen.coroutine
    def pull(cls, message, connection):
        session = connection.session
        with (yield session._lock.acquire()):
            log.debug("Sending pull-doc-reply from session %r", session.id)
            reply = connection.protocol.create('PULL-DOC-REPLY', message.header['msgid'], session.document)
            raise gen.Return(reply)

    @classmethod
    @gen.coroutine
    def push(cls, message, connection):
        session = connection.session
        with (yield session._lock.acquire()):
            log.debug("pushing doc to session %r", session.id)
            message.push_to_document(session.document)
            raise gen.Return(connection.ok(message))

    # this method is split out of the patch() class method so we
    # can monkeypatch it in the tests
    @gen.coroutine
    def _handle_patch(self, message, connection):
        with (yield self._lock.acquire()):
            self._current_patch = message
            self._current_patch_connection = connection
            try:
                message.apply_to_document(self.document)
            finally:
                self._current_patch = None
                self._current_patch_connection = None

            raise gen.Return(connection.ok(message))

    @classmethod
    @gen.coroutine
    def patch(cls, message, connection):
        work = yield connection.session._handle_patch(message, connection)
        raise gen.Return(work)
