from __future__ import absolute_import, print_function

from types import ModuleType
import os
import sys
import traceback

from bokeh.util.serialization import make_id

class _CodeRunner(object):
    """ Compile and run a Python source code."""

    def __init__(self, source, path, argv):
        self._failed = False
        self._error = None
        self._error_detail = None

        import ast
        self._code = None

        try:
            nodes = ast.parse(source, path)
            self._code = compile(nodes, filename=path, mode='exec')
        except SyntaxError as e:
            self._failed = True
            self._error = ("Invalid syntax in \"%s\" on line %d:\n%s" % (os.path.basename(e.filename), e.lineno, e.text))
            import traceback
            self._error_detail = traceback.format_exc()

        self._path = path
        self._source = source
        self._argv = argv
        self.ran = False

    @property
    def source(self):
        return self._source


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

        module_name = 'bk_script_' + make_id().replace('-', '')
        module = ModuleType(module_name)
        module.__dict__['__file__'] = os.path.abspath(self._path)

        return module

    def run(self, module, post_check):
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

            exc_type, exc_value, exc_traceback = sys.exc_info()
            filename, line_number, func, txt = traceback.extract_tb(exc_traceback)[-1]

            self._error = "%s\nFile \"%s\", line %d, in %s:\n%s" % (str(e), os.path.basename(filename), line_number, func, txt)

        finally:
            # undo sys.path, CWD fixups
            os.chdir(_cwd)
            sys.path = _sys_path
            sys.argv = _sys_argv
            self.ran = True
