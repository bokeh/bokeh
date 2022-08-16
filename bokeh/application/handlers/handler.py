#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a base class for Bokeh Application handler classes.

When a Bokeh server session is initiated, the Bokeh server asks the Application
for a new Document to service the session. To do this, the Application first
creates a new empty Document, then it passes this new Document to the
``modify_document`` method of each of its handlers. When all handlers have
updated the Document, it is used to service the user session.

Below is an example outline of a custom handler that might modify documents
based off information in some database:

.. code-block:: python

    class DatabaseHandler(Handler):
        """ A Bokeh Application handler to initialize Documents from a database

        """

        def modify_document(self, doc: Document) -> None:
            # do some data base lookup here to generate 'plot'

            # add the plot to the document (i.e modify the document)
            doc.add_root(plot)

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
import os
import sys
import traceback
from typing import TYPE_CHECKING, Any

# Bokeh imports
from ...document import Document
from ..application import ServerContext, SessionContext

if TYPE_CHECKING:
    from tornado.httputil import HTTPServerRequest

    from .code_runner import CodeRunner

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Handler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Handler:
    ''' Provide a mechanism for Bokeh applications to build up new Bokeh
    Documents.

    .. autoclasstoc::

    '''

    _failed: bool
    _error: str | None
    _error_detail: str | None
    _static: str | None

    def __init__(self) -> None:
        self._failed = False
        self._error = None
        self._error_detail = None
        self._static = None

    # Properties --------------------------------------------------------------

    @property
    def error(self) -> str | None:
        ''' If the handler fails, may contain a related error message.

        '''
        return self._error

    @property
    def error_detail(self) -> str | None:
        ''' If the handler fails, may contain a traceback or other details.

        '''
        return self._error_detail

    @property
    def failed(self) -> bool:
        ''' ``True`` if the handler failed to modify the doc

        '''
        return self._failed

    @property
    def safe_to_fork(self) -> bool:
        return True

    # Public methods ----------------------------------------------------------

    def modify_document(self, doc: Document) -> None:
        ''' Modify an application document in a specified manner.

        When a Bokeh server session is initiated, the Bokeh server asks the
        Application for a new Document to service the session. To do this,
        the Application first creates a new empty Document, then it passes
        this Document to the ``modify_document`` method of each of its
        handlers. When all handlers have updated the Document, it is used to
        service the user session.

        *Subclasses must implement this method*

        Args:
            doc (Document) : A Bokeh Document to update in-place

        Returns:
            Document

        '''
        raise NotImplementedError("implement modify_document()")

    def on_server_loaded(self, server_context: ServerContext) -> None:
        ''' Execute code when the server is first started.

        Subclasses may implement this method to provide for any one-time
        initialization that is necessary after the server starts, but
        before any sessions are created.

        Args:
            server_context (ServerContext) :

        '''
        pass

    def on_server_unloaded(self, server_context: ServerContext) -> None:
        ''' Execute code when the server cleanly exits. (Before stopping the
        server's ``IOLoop``.)

        Subclasses may implement this method to provide for any one-time
        tear down that is necessary before the server exits.

        Args:
            server_context (ServerContext) :

        .. warning::
            In practice this code may not run, since servers are often killed
            by a signal.

        '''
        pass

    async def on_session_created(self, session_context: SessionContext) -> None:
        ''' Execute code when a new session is created.

        Subclasses may implement this method to provide for any per-session
        initialization that is necessary before ``modify_doc`` is called for
        the session.

        Args:
            session_context (SessionContext) :

        '''
        pass

    async def on_session_destroyed(self, session_context: SessionContext) -> None:
        ''' Execute code when a session is destroyed.

        Subclasses may implement this method to provide for any per-session
        tear-down that is necessary when sessions are destroyed.

        Args:
            session_context (SessionContext) :

        '''
        pass

    def process_request(self, request: HTTPServerRequest) -> dict[str, Any]:
        ''' Processes incoming HTTP request returning a dictionary of
        additional data to add to the session_context.

        Args:
            request: HTTP request

        Returns:
            A dictionary of JSON serializable data to be included on
            the session context.
        '''
        return {}

    def static_path(self) -> str | None:
        ''' Return a path to app-specific static resources, if applicable.

        '''
        if self.failed:
            return None
        else:
            return self._static

    def url_path(self) -> str | None:
        ''' Returns a default URL path, if applicable.

        Handlers subclasses may optionally implement this method, to inform
        the Bokeh application what URL it should be installed at.

        If multiple handlers specify ``url_path`` the Application will use the
        value from the first handler in its list of handlers.

        '''
        return None


def handle_exception(handler: Handler | CodeRunner, e: Exception) -> None:
    ''' Record an exception and details on a Handler.

    '''
    handler._failed = True
    handler._error_detail = traceback.format_exc()

    _, _, exc_traceback = sys.exc_info()
    filename, line_number, func, txt = traceback.extract_tb(exc_traceback)[-1]

    basename = os.path.basename(filename)
    handler._error = f"{e}\nFile {basename!r}, line {line_number}, in {func}:\n{txt}"

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
