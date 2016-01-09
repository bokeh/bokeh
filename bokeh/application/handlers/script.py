from __future__ import absolute_import, print_function

import os
import sys

from bokeh.io import set_curdoc, curdoc

from .handler import Handler
from .code_runner import _CodeRunner

class ScriptHandler(Handler):
    """Run a script which modifies a Document"""

    _io_functions = ['output_server', 'output_notebook', 'output_file',
                     'show', 'save', 'push', 'reset_output']

    def __init__(self, *args, **kwargs):
        super(ScriptHandler, self).__init__(*args, **kwargs)
        if 'filename' in kwargs:
            self._runner = _CodeRunner(path=kwargs['filename'])
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
            return '/' + os.path.splitext(os.path.basename(self._runner.path))[0]

    def _make_io_complainer(self, name):
        def complainer(*args, **kwargs):
            print("""
    %s: Warning: call to %s() should not be needed in scripts run by the 'bokeh'
    command, try running this with 'python' or remove the call to %s(). Ignoring
    %s() call.""" % (self._runner.path, name, name, name), file=sys.stderr)
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

        module = self._runner.new_module()

        # This is to prevent the module from being gc'd before the
        # document is.  A symptom of a gc'd module is that its
        # globals become None.
        if not hasattr(doc, '_ScriptHandler__modules'):
            setattr(doc, '_ScriptHandler__modules', [])
        doc.__modules.append(module)

        old_doc = curdoc()
        set_curdoc(doc)
        old_io = self._monkeypatch_io()

        try:
            def post_check():
                newdoc = curdoc()
                # script is supposed to edit the doc not replace it
                if newdoc is not doc:
                    raise RuntimeError("Script at '%s' replaced the output document" % (self._runner.path))
            self._runner.run(module, post_check)
        finally:
            self._unmonkeypatch_io(old_io)
            set_curdoc(old_doc)

    @property
    def failed(self):
        return self._runner.failed

    @property
    def error(self):
        return self._runner.error

    @property
    def error_detail(self):
        return self._runner.error_detail
