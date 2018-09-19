#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Bokeh Application Handler to look for Bokeh server lifecycle callbacks
in a specified Python module.

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
from .handler import Handler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'LifecycleHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class LifecycleHandler(Handler):
    ''' Load a script which contains server lifecycle callbacks.

    '''

    def __init__(self, *args, **kwargs):
        super(LifecycleHandler, self).__init__(*args, **kwargs)
        self._on_server_loaded = _do_nothing
        self._on_server_unloaded = _do_nothing
        self._on_session_created = _do_nothing
        self._on_session_destroyed = _do_nothing
        self.safe_to_fork = True

    # Public methods ----------------------------------------------------------

    def modify_document(self, doc):
        ''' This handler does not make any modifications to the Document.

        Args:
            doc (Document) : A Bokeh Document to update in-place

                *This handler does not modify the document*

        Returns:
            None

        '''
        # we could support a modify_document function, might be weird though.
        pass

    def on_server_loaded(self, server_context):
        ''' Execute `on_server_unloaded`` from the configured module (if
        it is defined) when the server is first started.

        Args:
            server_context (ServerContext) :

        '''
        return self._on_server_loaded(server_context)

    def on_server_unloaded(self, server_context):
        ''' Execute ``on_server_unloaded`` from the configured module (if
        it is defined) when the server cleanly exits. (Before stopping the
        server's ``IOLoop``.)

        Args:
            server_context (ServerContext) :

        .. warning::
            In practice this code may not run, since servers are often killed
            by a signal.

        '''
        return self._on_server_unloaded(server_context)

    def on_session_created(self, session_context):
        ''' Execute ``on_session_created`` from the configured module (if
        it is defined) when a new session is created.

        Args:
            session_context (SessionContext) :

        '''
        return self._on_session_created(session_context)

    def on_session_destroyed(self, session_context):
        ''' Execute ``on_session_destroyed`` from the configured module (if
        it is defined) when a new session is destroyed.

        Args:
            session_context (SessionContext) :

        '''
        return self._on_session_destroyed(session_context)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _do_nothing(ignored):
    pass

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
