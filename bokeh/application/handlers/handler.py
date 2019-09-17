#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
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

        def modify_document(self, doc):

            # do some data base lookup here to generate 'plot'

            # add the plot to the document (i.e modify the document)
            doc.add_root(plot)

            # and return it
            return doc

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports

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

class Handler(object):
    ''' Provide a mechanism for Bokeh applications to build up new Bokeh
    Documents.


    '''

    def __init__(self, *args, **kwargs):
        self._failed = False
        self._error = None
        self._error_detail = None
        self._static = None

    # Properties --------------------------------------------------------------

    @property
    def error(self):
        ''' If the handler fails, may contain a related error message.

        '''
        return self._error

    @property
    def error_detail(self):
        ''' If the handler fails, may contain a traceback or other details.

        '''
        return self._error_detail

    @property
    def failed(self):
        ''' ``True`` if the handler failed to modify the doc

        '''
        return self._failed

    # Public methods ----------------------------------------------------------

    def modify_document(self, doc):
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

    def on_server_loaded(self, server_context):
        ''' Execute code when the server is first started.

        Subclasses may implement this method to provide for any one-time
        initialization that is necessary after the server starts, but
        before any sessions are created.

        Args:
            server_context (ServerContext) :

        '''
        pass

    def on_server_unloaded(self, server_context):
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

    def on_session_created(self, session_context):
        ''' Execute code when a new session is created.

        Subclasses may implement this method to provide for any per-session
        initialization that is necessary before ``modify_doc`` is called for
        the session.

        Args:
            session_context (SessionContext) :

        '''
        pass

    def on_session_destroyed(self, session_context):
        ''' Execute code when a session is destroyed.

        Subclasses may implement this method to provide for any per-session
        tear-down that is necessary when sessions are destroyed.

        Args:
            session_context (SessionContext) :

        '''
        pass

    def static_path(self):
        ''' Return a path to app-specific static resources, if applicable.

        '''
        if self.failed:
            return None
        else:
            return self._static

    def url_path(self):
        ''' Returns a default URL path, if applicable.

        Handlers subclasses may optionally implement this method, to inform
        the Bokeh application what URL it should be installed at.

        If multiple handlers specify ``url_path`` the Application will use the
        value from the first handler in its list of handlers.

        '''
        return None

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
