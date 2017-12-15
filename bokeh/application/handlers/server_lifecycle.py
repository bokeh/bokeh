#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
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

from bokeh.util.api import general, dev ; general, dev

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import codecs
import os

# External imports

# Bokeh imports
from ...util.callback_manager import _check_callback
from .code_runner import CodeRunner
from .handler import Handler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@general((1,0,0))
class ServerLifecycleHandler(Handler):
    ''' Load a script which contains server lifecycle callbacks.

    '''

    def __init__(self, *args, **kwargs):
        '''

        Keyword Args:
            filename (str) : path to a module to load lifecycle callbacks from

            argv (list[str], optional) : a list of string arguments to use as
                ``sys.argv`` when the callback code is executed. (default: [])

        '''
        super(ServerLifecycleHandler, self).__init__(*args, **kwargs)

        if 'filename' not in kwargs:
            raise ValueError('Must pass a filename to ServerLifecycleHandler')
        filename = kwargs['filename']
        argv = kwargs.get('argv', [])

        source = codecs.open(filename, 'r', 'UTF-8').read()

        self._runner = CodeRunner(source, filename, argv)

        self._on_server_loaded = _do_nothing
        self._on_server_unloaded = _do_nothing
        self._on_session_created = _do_nothing
        self._on_session_destroyed = _do_nothing

        if not self._runner.failed:
            # unlike ScriptHandler, we only load the module one time
            self._module = self._runner.new_module()

            def extract_callbacks():
                contents = self._module.__dict__
                if 'on_server_loaded' in contents:
                    self._on_server_loaded = contents['on_server_loaded']
                if 'on_server_unloaded' in contents:
                    self._on_server_unloaded = contents['on_server_unloaded']
                if 'on_session_created' in contents:
                    self._on_session_created = contents['on_session_created']
                if 'on_session_destroyed' in contents:
                    self._on_session_destroyed = contents['on_session_destroyed']

                _check_callback(self._on_server_loaded, ('server_context',), what="on_server_loaded")
                _check_callback(self._on_server_unloaded, ('server_context',), what="on_server_unloaded")
                _check_callback(self._on_session_created, ('session_context',), what="on_session_created")
                _check_callback(self._on_session_destroyed, ('session_context',), what="on_session_destroyed")

            self._runner.run(self._module, extract_callbacks)

    # Properties --------------------------------------------------------------

    @property
    @general((1,0,0))
    def error(self):
        ''' If the handler fails, may contain a related error message.

        '''
        return self._runner.error

    @property
    @general((1,0,0))
    def error_detail(self):
        ''' If the handler fails, may contain a traceback or other details.

        '''
        return self._runner.error_detail

    @property
    @general((1,0,0))
    def failed(self):
        ''' ``True`` if the lifecycle callbacks failed to execute

        '''
        return self._runner.failed

    # Public methods ----------------------------------------------------------

    @general((1,0,0))
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

    @general((1,0,0))
    def on_server_loaded(self, server_context):
        ''' Execute `on_server_unloaded`` from the configured module (if
        it is defined) when the server is first started.

        Args:
            server_context (ServerContext) :

        '''
        return self._on_server_loaded(server_context)

    @general((1,0,0))
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

    @general((1,0,0))
    def on_session_created(self, session_context):
        ''' Execute ``on_session_created`` from the configured module (if
        it is defined) when a new session is created.

        Args:
            session_context (SessionContext) :

        '''
        return self._on_session_created(session_context)

    @general((1,0,0))
    def on_session_destroyed(self, session_context):
        ''' Execute ``on_session_destroyed`` from the configured module (if
        it is defined) when a new session is destroyed.

        Args:
            session_context (SessionContext) :

        '''
        return self._on_session_destroyed(session_context)

    @general((1,0,0))
    def url_path(self):
        ''' The last path component for the basename of the path to the
        callback module.

        '''
        if self.failed:
            return None
        else:
            # TODO should fix invalid URL characters
            return '/' + os.path.splitext(os.path.basename(self._runner.path))[0]

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
