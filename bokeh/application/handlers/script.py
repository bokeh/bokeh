from __future__ import absolute_import, print_function

from .handler import Handler
import uuid
import os
from os.path import abspath
import sys
from bokeh.io import set_curdoc, curdoc
import codecs


class ScriptHandler(Handler):
    """Run a script which modifies a Document"""

    _io_functions = ['output_server', 'output_notebook', 'output_file',
                     'show', 'save', 'push', 'reset_output']

    def __init__(self, *args, **kwargs):
        super(ScriptHandler, self).__init__(*args, **kwargs)
        import ast
        self._code = None
        if 'filename' in kwargs:
            src_path = kwargs['filename']
            source = codecs.open(src_path, 'r', 'UTF-8').read()
            try:
                nodes = ast.parse(source, src_path)
                self._code = compile(nodes, filename=src_path, mode='exec')
            except SyntaxError as e:
                self._failed = True
                self._error = ("Invalid syntax in \"%s\" on line %d:\n%s" % (os.path.basename(e.filename), e.lineno, e.text))
                import traceback
                self._error_detail = traceback.format_exc()

            self._path = src_path
        else:
            raise ValueError('Must pass a filename to ScriptHandler')

        self._complainers = {}
        for f in ScriptHandler._io_functions:
            self._complainers[f] = self._make_io_complainer(f)

    def url_path(self):
        if self.failed:
            return None
        else:
            # TODO should fix invalid URL characters
            return '/' + os.path.splitext(os.path.basename(self._path))[0]

    def _make_io_complainer(self, name):
        def complainer(*args, **kwargs):
            print("""
    %s: Warning: call to %s() should not be needed in scripts run by the 'bokeh'
    command, try running this with 'python' or remove the call to %s(). Ignoring
    %s() call.""" % (self._path, name, name, name), file=sys.stderr)
        return complainer

    # monkeypatching is a little ugly, but in this case there's no reason any legitimate
    # code should be calling these functions, and we're only making a best effort to
    # warn people so no big deal if we fail.
    def _monkeypatch_io(self):
        import bokeh.io as io
        old = {}
        for f in ScriptHandler._io_functions:
            old[f] = getattr(io, f)
            setattr(io, f, self._complainers[f])

        return old

    def _unmonkeypatch_io(self, old):
        import bokeh.io as io
        for f in old:
            setattr(io, f, old[f])

    def modify_document(self, doc):
        if self.failed:
            return
        from types import ModuleType
        self._module_name = 'bk_script_' + str(uuid.uuid4()).replace('-', '')
        self._module = ModuleType(self._module_name)
        self._module.__dict__['__file__'] = abspath(self._path)
        old_doc = curdoc()
        set_curdoc(doc)
        old_io = self._monkeypatch_io()
        try:
            exec(self._code, self._module.__dict__)
            newdoc = curdoc()
            # script is supposed to edit the doc not replace it
            if newdoc is not doc:
                raise RuntimeError("Script at '%s' replaced the output document" % (self._path))
        except Exception as e:
            self._failed = True
            import traceback
            self._error_detail = traceback.format_exc()

            exc_type, exc_value, exc_traceback = sys.exc_info()
            filename, line_number, func, txt = traceback.extract_tb(exc_traceback)[-1]

            self._error = "%s\nFile \"%s\", line %d, in %s:\n%s" % (str(e), os.path.basename(filename), line_number, func, txt)
        finally:
            self._unmonkeypatch_io(old_io)
            set_curdoc(old_doc)
