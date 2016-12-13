from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

import os
import sys

from bokeh.io import set_curdoc, curdoc

from .code_runner import _CodeRunner
from .handler import Handler

class CodeHandler(Handler):
    """ Run source code which modifies a Document

    Args:
        source (str) : python source code
        filename (str) : a filename to use in any debugging or error output

    """

    _io_functions = ['output_server', 'output_notebook', 'output_file',
                     'show', 'save', 'push', 'reset_output']

    def __init__(self, *args, **kwargs):
        super(CodeHandler, self).__init__(*args, **kwargs)

        if 'source' not in kwargs:
            raise ValueError('Must pass source to CodeHandler')
        source = kwargs['source']

        if 'filename' not in kwargs:
            raise ValueError('Must pass a filename to CodeHandler')
        filename = kwargs['filename']

        argv = kwargs.get('argv', [])

        self._runner = _CodeRunner(source, filename, argv)

        self._loggers = {}
        for f in CodeHandler._io_functions:
            self._loggers[f] = self._make_io_logger(f)

    def url_path(self):
        if self.failed:
            return None
        else:
            # TODO should fix invalid URL characters
            return '/' + os.path.splitext(os.path.basename(self._runner.path))[0]

    def modify_document(self, doc):
        if self.failed:
            return

        module = self._runner.new_module()

        # One reason modules are stored is to prevent the module
        # from being gc'd before the document is. A symptom of a
        # gc'd module is that its globals become None. Additionally
        # stored modules are used to provide correct paths to
        # custom models resolver.
        sys.modules[module.__name__] = module
        doc._modules.append(module)

        old_doc = curdoc()
        set_curdoc(doc)
        old_io = self._monkeypatch_io()

        try:
            def post_check():
                newdoc = curdoc()
                # script is supposed to edit the doc not replace it
                if newdoc is not doc:
                    raise RuntimeError("%s at '%s' replaced the output document" % (self._origin, self._runner.path))
            self._runner.run(module, post_check)
        finally:
            self._unmonkeypatch_io(old_io)
            set_curdoc(old_doc)

    # subclassess must define self._logger_text
    def _make_io_logger(self, name):
        def logger(*args, **kwargs):
            log.info(self._logger_text , self._runner.path, name)
        return logger

    # monkeypatching is a little ugly, but in this case there's no reason any legitimate
    # code should be calling these functions, and we're only making a best effort to
    # warn people so no big deal if we fail.
    def _monkeypatch_io(self):
        import bokeh.io as io
        old = {}
        for f in CodeHandler._io_functions:
            old[f] = getattr(io, f)
            setattr(io, f, self._loggers[f])

        return old

    def _unmonkeypatch_io(self, old):
        import bokeh.io as io
        for f in old:
            setattr(io, f, old[f])

    @property
    def failed(self):
        return self._runner.failed

    @property
    def error(self):
        return self._runner.error

    @property
    def error_detail(self):
        return self._runner.error_detail

    @property
    def safe_to_fork(self):
        return not self._runner.ran
