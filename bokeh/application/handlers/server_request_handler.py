#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Bokeh Application Handler to look for Bokeh server request callbacks
in a specified Python module.

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
import codecs
import os

# Bokeh imports
from ...util.callback_manager import _check_callback
from .code_runner import CodeRunner
from .request_handler import RequestHandler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ServerRequestHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class ServerRequestHandler(RequestHandler):
    ''' Load a script which contains server request handler callbacks.

    '''

    def __init__(self, *args, **kwargs):
        '''

        Keyword Args:
            filename (str) : path to a module to load request handler callbacks from

            argv (list[str], optional) : a list of string arguments to use as
                ``sys.argv`` when the callback code is executed. (default: [])

        '''
        super().__init__(*args, **kwargs)

        if 'filename' not in kwargs:
            raise ValueError('Must pass a filename to ServerRequestHandler')
        filename = kwargs['filename']
        argv = kwargs.get('argv', [])
        package = kwargs.get('package', False)

        source = codecs.open(filename, 'r', 'UTF-8').read()

        self._runner = CodeRunner(source, filename, argv, package=package)

        if not self._runner.failed:
            # unlike ScriptHandler, we only load the module one time
            self._module = self._runner.new_module()

            def extract_callbacks():
                contents = self._module.__dict__
                if 'process_request' in contents:
                    self._process_request = contents['process_request']

                _check_callback(self._process_request, ('request',), what="process_request")

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
        ''' ``True`` if the request handler callbacks failed to execute

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
