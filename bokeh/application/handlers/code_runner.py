#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
import sys
import traceback
from os.path import basename
from types import ModuleType

# Bokeh imports
from ...util.serialization import make_globally_unique_id
from .handler import handle_exception

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

class CodeRunner:
    ''' Compile and run Python source code.

    '''

    def __init__(self, source, path, argv, package=None):
        '''

        Args:
            source (str) :
                A string containing Python source code to execute

            path (str) :
                A filename to use in any debugging or error output

            argv (list[str]) :
                A list of string arguments to make available as ``sys.argv``
                when the code executes

            package (bool) :
                An optional package module to configure

        Raises:
            ValueError, if package is specified for an __init__.py

        '''
        if package and basename(path) == "__init__.py":
            raise ValueError("__init__.py cannot have package specified")

        self._permanent_error = None
        self._permanent_error_detail = None
        self.reset_run_errors()

        import ast
        self._code = None

        try:
            nodes = ast.parse(source, path)
            self._code = compile(nodes, filename=path, mode='exec', dont_inherit=True)
        except SyntaxError as e:
            self._code = None
            self._permanent_error = ("Invalid syntax in \"%s\" on line %d:\n%s" % (os.path.basename(e.filename), e.lineno, e.text))
            self._permanent_error_detail = traceback.format_exc()

        self._path = path
        self._source = source
        self._argv = argv
        self._package = package
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

        module_name = 'bokeh_app_' + make_globally_unique_id().replace('-', '')
        module = ModuleType(module_name)
        module.__dict__['__file__'] = os.path.abspath(self._path)
        if self._package:
            module.__package__ = self._package.__name__
            module.__path__ = [os.path.dirname(self._path)]
        if basename(self.path) == "__init__.py":
            module.__package__ = module_name
            module.__path__ = [os.path.dirname(self._path)]

        return module

    def reset_run_errors(self):
        ''' Clears any transient error conditions from a previous run.

        Returns
            None

        '''
        self._failed = False
        self._error = None
        self._error_detail = None

    def run(self, module, post_check=None):
        ''' Execute the configured source code in a module and run any post
        checks.

        Args:
            module (Module) :
                A module to execute the configured code in.

            post_check (callable, optional) :
                A function that raises an exception if expected post-conditions
                are not met after code execution.

        '''
        try:
            # Simulate the sys.path behaviour described here:
            #
            # https://docs.python.org/2/library/sys.html#sys.path
            _cwd = os.getcwd()
            _sys_path = list(sys.path)
            _sys_argv = list(sys.argv)
            sys.path.insert(0, os.path.dirname(self._path))
            sys.argv = [os.path.basename(self._path)] + self._argv

            exec(self._code, module.__dict__)

            if post_check: post_check()

        except Exception as e:
            handle_exception(self, e)

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
