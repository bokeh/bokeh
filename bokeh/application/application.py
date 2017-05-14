'''

'''
from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

from tornado import gen

from abc import ABCMeta, abstractmethod

from ..util.future import with_metaclass
from ..util.tornado import yield_for_all_futures
from ..document import Document
from ..settings import settings

class ServerContext(with_metaclass(ABCMeta)):
    @property
    @abstractmethod
    def sessions(self):
        """ SessionContext instances belonging to this application."""
        raise NotImplementedError("sessions property, should return SessionContext")

    @abstractmethod
    def add_next_tick_callback(self, callback):
        """ Adds a callback to be run on the next tick of the event loop."""
        raise NotImplementedError("add_next_tick_callback")

    @abstractmethod
    def remove_next_tick_callback(self, callback):
        """ Removes a callback added with add_next_tick_callback, before it runs."""
        raise NotImplementedError("remove_next_tick_callback")

    @abstractmethod
    def add_timeout_callback(self, callback, timeout_milliseconds):
        """ Adds a callback to be run once after timeout_milliseconds."""
        raise NotImplementedError("add_timeout_callback")

    @abstractmethod
    def remove_timeout_callback(self, callback):
        """ Removes a callback added with add_timeout_callback, before it runs."""
        raise NotImplementedError("remove_timeout_callback")

    @abstractmethod
    def add_periodic_callback(self, callback, period_milliseconds):
        """ Adds a callback to be run every period_milliseconds until it is removed."""
        raise NotImplementedError("add_periodic_callback")

    @abstractmethod
    def remove_periodic_callback(self, callback):
        """ Removes a callback added with add_periodic_callback."""
        raise NotImplementedError("remove_periodic_callback")

class SessionContext(with_metaclass(ABCMeta)):
    def __init__(self, server_context, session_id):
        self._server_context = server_context
        self._id = session_id

    @property
    def server_context(self):
        return self._server_context

    @property
    def id(self):
        return self._id

    @property
    @abstractmethod
    def destroyed(self):
        """If True, the session has been discarded and cannot be used. A
        new session with the same ID could be created later but
        this object instance will not come back to life.

        """
        raise NotImplementedError("destroyed")

    @abstractmethod
    def with_locked_document(self, func):
        """ Runs a function with the document lock held, passing the document to the function.
        The function may return a future.

        Args:
            func: function that takes a single parameter (the Document) and returns None or a Future

        Returns:
            a Future containing the result of the function

        """
        raise NotImplementedError("locked_document")

class Application(object):
    ''' An Application is a factory for Document instances.

    '''

    # This is so that bokeh.io.show can check if a passed in object is an
    # Application without having to import Application directly. This module
    # depends on tornado and we have made a commitment that "basic" modules
    # will function without bringing in tornado.
    _is_a_bokeh_application_class = True

    def __init__(self, *handlers):
        self._static_path = None
        self._handlers = []
        for h in handlers:
            self.add(h)

    def create_document(self):
        ''' Creates and initializes a document using the Application's handlers.'''
        doc = Document()
        self.initialize_document(doc)
        return doc

    def initialize_document(self, doc):
        ''' Fills in a new document using the Application's handlers. '''
        for h in self._handlers:
            # TODO (havocp) we need to check the 'failed' flag on each handler
            # and build a composite error display. In develop mode, we want to
            # somehow get these errors to the client.
            h.modify_document(doc)
            if h.failed:
                log.error("Error running application handler %r: %s %s ", h, h.error, h.error_detail)

        if settings.perform_document_validation():
            doc.validate()

    def add(self, handler):
        ''' Add a handler to the pipeline used to initialize new documents.

        Args:
            handler (Handler) : a handler to process this Application

        '''
        self._handlers.append(handler)

        # make sure there is at most one static path
        static_paths = set(h.static_path() for h in self.handlers)
        static_paths.discard(None)
        if len(static_paths) > 1:
            raise RuntimeError("More than one static path requested for app: %r" % list(static_paths))
        elif len(static_paths) == 1:
            self._static_path = static_paths.pop()
        else:
            self._static_path = None

    @property
    def handlers(self):
        return tuple(self._handlers)

    @property
    def safe_to_fork(self):
        return all(handler.safe_to_fork for handler in self._handlers)

    @property
    def static_path(self):
        return self._static_path

    def on_server_loaded(self, server_context):
        """ Invoked after server startup but before any sessions are created."""
        for h in self._handlers:
            h.on_server_loaded(server_context)

    def on_server_unloaded(self, server_context):
        """ Invoked in theory if the server shuts down cleanly, probably
        not invoked most of the time in practice since servers tend to be
        killed by a signal. Invoked before stopping the server's IOLoop."""
        for h in self._handlers:
            h.on_server_unloaded(server_context)

    @gen.coroutine
    def on_session_created(self, session_context):
        """ Invoked when we create a new session, with a blank Document that
        hasn't been filled in yet.
        May return a Future which will delay session creation until the Future completes."""
        for h in self._handlers:
            result = h.on_session_created(session_context)
            yield yield_for_all_futures(result)
        raise gen.Return(None)

    @gen.coroutine
    def on_session_destroyed(self, session_context):
        """ Invoked when we have destroyed a session.
        ``session_context.destroyed`` will be True."""
        for h in self._handlers:
            result = h.on_session_destroyed(session_context)
            yield yield_for_all_futures(result)
        raise gen.Return(None)
