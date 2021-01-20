#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide the ``Application`` class.

Application instances are factories for creating new Bokeh Documents.

When a Bokeh server session is initiated, the Bokeh server asks the Application
for a new Document to service the session. To do this, the Application first
creates a new empty Document, then it passes this new Document to the
``modify_document`` method of each of its handlers. When all handlers have
updated the Document, it is used to service the user session.

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
from abc import ABCMeta, abstractmethod

# Bokeh imports
from ..document import Document
from ..settings import settings

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Application',
    'ServerContext',
    'SessionContext',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Application:
    ''' An Application is a factory for Document instances.

    '''

    # This is so that bokeh.io.show can check if a passed in object is an
    # Application without having to import Application directly. This module
    # depends on tornado and we have made a commitment that "basic" modules
    # will function without bringing in tornado.
    _is_a_bokeh_application_class = True

    def __init__(self, *handlers, **kwargs):
        ''' Application factory.

        Args:
            handlers (seq[Handler]): List of handlers to call.
                The URL is taken from the first one only.

        Keyword Args:
            metadata (dict): arbitrary user-supplied JSON data to make available
                with the application.

                The server will provide a URL ``http://applicationurl/metadata``
                which returns a JSON blob of the form:

                .. code-block:: json

                    {
                        "data": {
                            "hi": "hi",
                            "there": "there"
                        },
                        "url": "/myapp"
                    }

                The user-supplied metadata is returned as-is under the
                ``"data"`` key in the blob.

        '''
        metadata = kwargs.pop('metadata', None)
        if kwargs:
            raise TypeError("Invalid keyword argument: %s" %
                list(kwargs.keys())[0])
        self._static_path = None
        self._handlers = []
        self._metadata = metadata
        for h in handlers:
            self.add(h)

    # Properties --------------------------------------------------------------

    @property
    def handlers(self):
        ''' The ordered list of handlers this Application is configured with.

        '''
        return tuple(self._handlers)

    @property
    def metadata(self):
        ''' Arbitrary user-supplied metadata to associate with this application.

        '''
        return self._metadata

    @property
    def safe_to_fork(self):
        '''

        '''
        return all(handler.safe_to_fork for handler in self._handlers)

    @property
    def static_path(self):
        ''' Path to any (optional) static resources specified by handlers.

        '''
        return self._static_path

    # Public methods ----------------------------------------------------------

    def add(self, handler):
        ''' Add a handler to the pipeline used to initialize new documents.

        Args:
            handler (Handler) : a handler for this Application to use to
                process Documents

        '''
        self._handlers.append(handler)

        # make sure there is at most one static path
        static_paths = {h.static_path() for h in self.handlers}
        static_paths.discard(None)
        if len(static_paths) > 1:
            raise RuntimeError("More than one static path requested for app: %r" % list(static_paths))
        elif len(static_paths) == 1:
            self._static_path = static_paths.pop()
        else:
            self._static_path = None

    def create_document(self):
        ''' Creates and initializes a document using the Application's handlers.

        '''
        doc = Document()
        self.initialize_document(doc)
        return doc

    def initialize_document(self, doc):
        ''' Fills in a new document using the Application's handlers.

        '''
        for h in self._handlers:
            # TODO (havocp) we need to check the 'failed' flag on each handler
            # and build a composite error display. In develop mode, we want to
            # somehow get these errors to the client.
            h.modify_document(doc)
            if h.failed:
                log.error("Error running application handler %r: %s %s ", h, h.error, h.error_detail)

        if settings.perform_document_validation():
            doc.validate()

    def on_server_loaded(self, server_context):
        ''' Invoked to execute code when a new session is created.

        This method calls ``on_server_loaded`` on each handler, in order,
        with the server context passed as the only argument.

        '''
        for h in self._handlers:
            h.on_server_loaded(server_context)

    def on_server_unloaded(self, server_context):
        ''' Invoked to execute code when the server cleanly exits. (Before
        stopping the server's ``IOLoop``.)

        This method calls ``on_server_unloaded`` on each handler, in order,
        with the server context passed as the only argument.

        .. warning::
            In practice this code may not run, since servers are often killed
            by a signal.

        '''
        for h in self._handlers:
            h.on_server_unloaded(server_context)

    async def on_session_created(self, session_context):
        ''' Invoked to execute code when a new session is created.

        This method calls ``on_session_created`` on each handler, in order,
        with the session context passed as the only argument.

        May return a ``Future`` which will delay session creation until the
        ``Future`` completes.

        '''
        for h in self._handlers:
            await h.on_session_created(session_context)
        return None

    async def on_session_destroyed(self, session_context):
        ''' Invoked to execute code when a session is destroyed.

        This method calls ``on_session_destroyed`` on each handler, in order,
        with the session context passed as the only argument.

        Afterwards, ``session_context.destroyed`` will be ``True``.

        '''
        for h in self._handlers:
            await h.on_session_destroyed(session_context)
        return None

    def process_request(self, request):
        ''' Processes incoming HTTP request returning a dictionary of
        additional data to add to the session_context.

        Args:
            request: HTTP request

        Returns:
            A dictionary of JSON serializable data to be included on
            the session context.
        '''
        request_data = {}
        for h in self._handlers:
            request_data.update(h.process_request(request))
        return request_data


class ServerContext(metaclass=ABCMeta):
    ''' A harness for server-specific information and tasks related to
    collections of Bokeh sessions.

    *This base class is probably not of interest to general users.*

    '''

    # Properties --------------------------------------------------------------

    @property
    @abstractmethod
    def sessions(self):
        ''' ``SessionContext`` instances belonging to this application.

        *Subclasses must implement this method.*

        '''
        pass

    # Public methods ----------------------------------------------------------

    @abstractmethod
    def add_next_tick_callback(self, callback):
        ''' Add a callback to be run on the next tick of the event loop.

        *Subclasses must implement this method.*

        Args:
            callback (callable) : a callback to add

                The callback will execute on the next tick of the event loop,
                and should have the form ``def callback()`` (i.e. it should
                not accept any arguments)

        Returns:
            an ID that can be used with ``remove_next_tick_callback``.

        '''
        pass

    @abstractmethod
    def add_periodic_callback(self, callback, period_milliseconds):
        ''' Add a callback to be run periodically until it is removed.

        *Subclasses must implement this method.*

        Args:
            callback (callable) : a callback to add

                The callback will execute periodically on the event loop
                as specified, and should have the form ``def callback()``
                (i.e. it should not accept any arguments)

            period_milliseconds (int) : number of milliseconds to wait
                between executing the callback.

        Returns:
            an ID that can be used with ``remove_periodic_callback``.

        '''
        pass

    @abstractmethod
    def add_timeout_callback(self, callback, timeout_milliseconds):
        ''' Add a callback to be run once after timeout_milliseconds.

        *Subclasses must implement this method.*

        Args:
            callback (callable) : a callback to add

                The callback will execute once on the event loop after the
                timeout has passed, and should have the form ``def callback()``
                (i.e. it should not accept any arguments)

            timeout_milliseconds (int) : number of milliseconds to wait before
                executing the callback.

        Returns:
            an ID that can be used with ``remove_timeout_callback``.

        '''
        pass

    @abstractmethod
    def remove_next_tick_callback(self, callback_id):
        ''' Remove a callback added with ``add_next_tick_callback``, before
        it runs.

         *Subclasses must implement this method.*

        Args:
            callback_id : the ID returned from ``add_next_tick_callback``

        '''
        pass

    @abstractmethod
    def remove_periodic_callback(self, callback_id):
        ''' Removes a callback added with ``add_periodic_callback``.

        *Subclasses must implement this method.*

        Args:
            callback_id : the ID returned from ``add_periodic_callback``

        '''
        pass

    @abstractmethod
    def remove_timeout_callback(self, callback_id):
        ''' Remove a callback added with ``add_timeout_callback``, before it
        runs.

        *Subclasses must implement this method.*

        Args:
            callback_id : the ID returned from ``add_timeout_callback``

        '''
        pass

class SessionContext(metaclass=ABCMeta):
    ''' A harness for server-specific information and tasks related to
    Bokeh sessions.

    *This base class is probably not of interest to general users.*

    '''

    def __init__(self, server_context, session_id):
        '''

        '''
        self._server_context = server_context
        self._id = session_id

    # Properties --------------------------------------------------------------

    @property
    @abstractmethod
    def destroyed(self):
        ''' If ``True``, the session has been discarded and cannot be used.

        A new session with the same ID could be created later but this instance
        will not come back to life.

        '''
        pass

    @property
    def id(self):
        ''' The unique ID for the session associated with this context.

        '''
        return self._id

    @property
    def server_context(self):
        ''' The server context for this session context

        '''
        return self._server_context

    # Public methods ----------------------------------------------------------

    @abstractmethod
    def with_locked_document(self, func):
        ''' Runs a function with the document lock held, passing the
        document to the function.

        *Subclasses must implement this method.*

        Args:
            func (callable): function that takes a single parameter (the Document)
                and returns ``None`` or a ``Future``

        Returns:
            a ``Future`` containing the result of the function

        '''
        pass

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
