#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a utility class ``CodeRunner`` for use by handlers that execute
Python source code.

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
import os
import sys
import traceback
from types import ModuleType

# External imports

# Bokeh imports
from ...util.serialization import make_id

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CodeRunner',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class CodeRunner(object):
    ''' Compile and run Python source code.

    '''

    def __init__(self, source, path, argv):
        '''

        Args:
            source (str) : python source code

            path (str) : a filename to use in any debugging or error output

            argv (list[str]) : a list of string arguments to make available
                as ``sys.argv`` when the code executes

        '''
        self._permanent_error = None
        self._permanent_error_detail = None
        self.reset_run_errors()

        import ast
        self._code = None

        try:
            nodes = ast.parse(source, path)
            self._code = compile(nodes, filename=path, mode='exec', dont_inherit=True)
        except SyntaxError as e:
            import traceback
            self._code = None
            self._permanent_error = ("Invalid syntax in \"%s\" on line %d:\n%s" % (os.path.basename(e.filename), e.lineno, e.text))
            self._permanent_error_detail = traceback.format_exc()

        self._path = path
        self._source = source
        self._argv = argv
        self.ran = False

    # Properties --------------------------------------------------------------

    @property
    def error(self):
        ''' If code execution fails, may contain a related error message.

        '''
        return self._error if self._permanent_error is None else self._permanent_error

    @property
    def error_detail(self):
        ''' If code execution fails, may contain a traceback or other details.

        '''
        return self._error_detail if self._permanent_error_detail is None else self._permanent_error_detail

    @property
    def failed(self):
        ''' ``True`` if code execution failed

        '''
        return self._failed or self._code is None

    @property
    def path(self):
        ''' The path that new modules will be configured with.

        '''
        return self._path

    @property
    def source(self):
        ''' The configured source code that will be executed when ``run`` is
        called.

        '''
        return self._source

    # Public methods ----------------------------------------------------------

    def new_module(self):
        ''' Make a fresh module to run in.

        Returns:
            Module

        '''
        self.reset_run_errors()

        if self._code is None:
            return None

        module_name = 'bk_script_' + make_id().replace('-', '')
        module = ModuleType(str(module_name)) # str needed for py2.7
        module.__dict__['__file__'] = os.path.abspath(self._path)

        return module

    def reset_run_errors(self):
        ''' Clears any transient error conditions from a previous run.

        Returns
            None

        '''
        self._failed = False
        self._error = None
        self._error_detail = None

    def run(self, module, post_check):
        ''' Execute the configured source code in a module and run any post
        checks.

        Args:
            module (Module) : a module to execute the configured code in.

            post_check(callable) : a function that can raise an exception
                if expected post-conditions are not met after code execution.

        '''
        try:
            # Simulate the sys.path behaviour decribed here:
            #
            # https://docs.python.org/2/library/sys.html#sys.path
            _cwd = os.getcwd()
            _sys_path = list(sys.path)
            _sys_argv = list(sys.argv)
            sys.path.insert(0, os.path.dirname(self._path))
            sys.argv = [os.path.basename(self._path)] + self._argv

            exec(self._code, module.__dict__)
            post_check()

        except Exception as e:
            self._failed = True
            self._error_detail = traceback.format_exc()

            _exc_type, _exc_value, exc_traceback = sys.exc_info()
            filename, line_number, func, txt = traceback.extract_tb(exc_traceback)[-1]

            self._error = "%s\nFile \"%s\", line %d, in %s:\n%s" % (str(e), os.path.basename(filename), line_number, func, txt)

        finally:
            # undo sys.path, CWD fixups
            os.chdir(_cwd)
            sys.path = _sys_path
            sys.argv = _sys_argv
            self.ran = True

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
