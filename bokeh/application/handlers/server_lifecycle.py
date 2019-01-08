#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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
import codecs
import os

# External imports

# Bokeh imports
from ...util.callback_manager import _check_callback
from .code_runner import CodeRunner
from .lifecycle import LifecycleHandler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ServerLifecycleHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class ServerLifecycleHandler(LifecycleHandler):
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
    def error(self):
        ''' If the handler fails, may contain a related error message.

        '''
        return self._runner.error

    @property
    def error_detail(self):
        ''' If the handler fails, may contain a traceback or other details.

        '''
        return self._runner.error_detail

    @property
    def failed(self):
        ''' ``True`` if the lifecycle callbacks failed to execute

        '''
        return self._runner.failed

    # Public methods ----------------------------------------------------------

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
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
