#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from abc import ABCMeta, abstractmethod
from typing import (
    TYPE_CHECKING,
    Any,
    Awaitable,
    Callable,
    ClassVar,
)

# Bokeh imports
from ..core.types import ID
from ..document import Document
from ..settings import settings

if TYPE_CHECKING:
    from tornado.httputil import HTTPServerRequest
    from typing_extensions import TypeAlias

    from ..server.session import ServerSession
    from .handlers.handler import Handler

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

Callback: TypeAlias = Callable[[], None]

class Application:
    ''' An Application is a factory for Document instances.

    '''

    # This is so that bokeh.io.show can check if a passed in object is an
    # Application without having to import Application directly. This module
    # depends on tornado and we have made a commitment that "basic" modules
    # will function without bringing in tornado.
    _is_a_bokeh_application_class: ClassVar[bool] = True

    _static_path: str | None
    _handlers: list[Handler]
    _metadata: dict[str, Any] | None

    def __init__(self, *handlers: Handler, metadata: dict[str, Any] | None = None) -> None:
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
        self._static_path = None
        self._handlers = []
        self._metadata = metadata
        for h in handlers:
            self.add(h)

    # Properties --------------------------------------------------------------

    @property
    def handlers(self) -> tuple[Handler, ...]:
        ''' The ordered list of handlers this Application is configured with.

        '''
        return tuple(self._handlers)

    @property
    def metadata(self) -> dict[str, Any] | None:
        ''' Arbitrary user-supplied metadata to associate with this application.

        '''
        return self._metadata

    @property
    def safe_to_fork(self) -> bool:
        '''

        '''
        return all(handler.safe_to_fork for handler in self._handlers)

    @property
    def static_path(self) -> str | None:
        ''' Path to any (optional) static resources specified by handlers.

        '''
        return self._static_path

    # Public methods ----------------------------------------------------------

    def add(self, handler: Handler) -> None:
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

    def create_document(self) -> Document:
        ''' Creates and initializes a document using the Application's handlers.

        '''
        doc = Document()
        self.initialize_document(doc)
        return doc

    def initialize_document(self, doc: Document) -> None:
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

    def on_server_loaded(self, server_context: ServerContext) -> None:
        ''' Invoked to execute code when a new session is created.

        This method calls ``on_server_loaded`` on each handler, in order,
        with the server context passed as the only argument.

        '''
        for h in self._handlers:
            h.on_server_loaded(server_context)

    def on_server_unloaded(self, server_context: ServerContext) -> None:
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

    async def on_session_created(self, session_context: SessionContext) -> None:
        ''' Invoked to execute code when a new session is created.

        This method calls ``on_session_created`` on each handler, in order,
        with the session context passed as the only argument.

        May return a ``Future`` which will delay session creation until the
        ``Future`` completes.

        '''
        for h in self._handlers:
            await h.on_session_created(session_context)
        return None

    async def on_session_destroyed(self, session_context: SessionContext) -> None:
        ''' Invoked to execute code when a session is destroyed.

        This method calls ``on_session_destroyed`` on each handler, in order,
        with the session context passed as the only argument.

        Afterwards, ``session_context.destroyed`` will be ``True``.

        '''
        for h in self._handlers:
            await h.on_session_destroyed(session_context)
        return None

    def process_request(self, request: HTTPServerRequest) -> dict[str, Any]:
        ''' Processes incoming HTTP request returning a dictionary of
        additional data to add to the session_context.

        Args:
            request: HTTP request

        Returns:
            A dictionary of JSON serializable data to be included on
            the session context.
        '''
        request_data: dict[str, Any] = {}
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
    def sessions(self) -> list[ServerSession]:
        ''' ``SessionContext`` instances belonging to this application.

        *Subclasses must implement this method.*

        '''
        pass

class SessionContext(metaclass=ABCMeta):
    ''' A harness for server-specific information and tasks related to
    Bokeh sessions.

    *This base class is probably not of interest to general users.*

    '''

    _server_context: ServerContext
    _id: ID

    def __init__(self, server_context: ServerContext, session_id: ID) -> None:
        '''

        '''
        self._server_context = server_context
        self._id = session_id

    # Properties --------------------------------------------------------------

    @property
    @abstractmethod
    def destroyed(self) -> bool:
        ''' If ``True``, the session has been discarded and cannot be used.

        A new session with the same ID could be created later but this instance
        will not come back to life.

        '''
        pass

    @property
    def id(self) -> ID:
        ''' The unique ID for the session associated with this context.

        '''
        return self._id

    @property
    def server_context(self) -> ServerContext:
        ''' The server context for this session context

        '''
        return self._server_context

    # Public methods ----------------------------------------------------------

    @abstractmethod
    def with_locked_document(self, func: Callable[[Document], Awaitable[None]]) -> Awaitable[None]:
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

SessionDestroyedCallback = Callable[[SessionContext], None]

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
