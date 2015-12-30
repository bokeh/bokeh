from __future__ import absolute_import, print_function

from os.path import abspath
from types import ModuleType
import codecs
import os
import sys
import traceback
import uuid

class _CodeRunner(object):
    """Load and run a Python file."""

    def __init__(self, path):
        self._failed = False
        self._error = None
        self._error_detail = None

        import ast
        self._code = None
        source = codecs.open(path, 'r', 'UTF-8').read()
        try:
            nodes = ast.parse(source, path)
            self._code = compile(nodes, filename=path, mode='exec')
        except SyntaxError as e:
            self._failed = True
            self._error = ("Invalid syntax in \"%s\" on line %d:\n%s" % (os.path.basename(e.filename), e.lineno, e.text))
            import traceback
            self._error_detail = traceback.format_exc()

        self._path = path

    @property
    def path(self):
        return self._path

    @property
    def failed(self):
        """True if the handler failed to modify the doc"""
        return self._failed

    @property
    def error(self):
        """Error message if the handler failed"""
        return self._error

    @property
    def error_detail(self):
        """Traceback or other details if the handler failed"""
        return self._error_detail

    def new_module(self):
        """Make a fresh module to run in."""
        if self.failed:
            return None

        module_name = 'bk_script_' + str(uuid.uuid4()).replace('-', '')
        module = ModuleType(module_name)
        module.__dict__['__file__'] = abspath(self._path)

        return module

    def run(self, module, post_check):
        try:
            exec(self._code, module.__dict__)
            post_check()
        except Exception as e:
            self._failed = True
            self._error_detail = traceback.format_exc()

            exc_type, exc_value, exc_traceback = sys.exc_info()
            filename, line_number, func, txt = traceback.extract_tb(exc_traceback)[-1]

            self._error = "%s\nFile \"%s\", line %d, in %s:\n%s" % (str(e), os.path.basename(filename), line_number, func, txt)
