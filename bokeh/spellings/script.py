from __future__ import absolute_import, print_function

from .handler import SpellingHandler
import uuid
import os
import sys
from bokeh.io import output_document, curdoc

class ScriptHandler(SpellingHandler):
    """Run a script which modifies a Document"""

    def __init__(self, *args, **kwargs):
        super(ScriptHandler, self).__init__(*args, **kwargs)
        import ast
        self._code = None
        if 'filename' in kwargs:
            src_path = kwargs['filename']
            source = open(src_path, 'r').read()
            try:
                nodes = ast.parse(source, src_path)
                self._code = compile(nodes, filename=src_path, mode='exec')
            except SyntaxError, e:
                self._failed = True
                self._error = ("Invalid syntax in \"%s\" on line %d:\n%s" % (os.path.basename(e.filename), e.lineno, e.text))
                import traceback
                self._error_detail = traceback.format_exc(e)

            self._path = src_path
        else:
            raise ValueError('Must pass a filename to ScriptHandler')

    def url_path(self):
        if self.failed:
            return None
        else:
            # TODO should fix invalid URL characters
            return '/' + os.path.splitext(os.path.basename(self._path))[0]

    def modify_document(self, doc):
        if self.failed:
            return
        from types import ModuleType
        self._module_name = 'bk_script_' + str(uuid.uuid4()).replace('-', '')
        self._module = ModuleType(self._module_name)
        output_document(doc)
        try:
            exec(self._code, self._module.__dict__)
            newdoc = curdoc()
            # script is supposed to edit the doc not replace it
            if newdoc is not doc:
                raise RuntimeError("Script at '%s' replaced the output document" % (self._path))
        except Exception, e:
            self._failed = True
            import traceback
            self._error_detail = traceback.format_exc(e)

            exc_type, exc_value, exc_traceback = sys.exc_info()
            filename, line_number, func, txt = traceback.extract_tb(exc_traceback)[-1]

            self._error = "%s\nFile \"%s\", line %d, in %s:\n%s" % (str(e), os.path.basename(filename), line_number, func, txt)


