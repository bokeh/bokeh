#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a Bokeh Application Handler to build up documents by compiling
and executing Python source code.

This Handler is used by the Bokeh server command line tool to build
applications that run off scripts and notebooks.

.. code-block:: python

    def make_doc(doc):

        # do work to modify the document, add plots, widgets, etc.

        return doc

    app = Application(FunctionHandler(make_doc))

    server = Server({'/bkapp': app}, io_loop=IOLoop.current())

    server.start()

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import general, dev ; general, dev

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
import sys

# External imports

# Bokeh imports
from ...io.doc import set_curdoc, curdoc
from .code_runner import CodeRunner
from .handler import Handler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@general((1,0,0))
class CodeHandler(Handler):
    ''' Run source code which modifies a Document

    '''

    # These functions, if present in the supplied code, will be monkey patched
    # to be no-ops, with a warning.
    _io_functions = ['output_notebook', 'output_file', 'show', 'save', 'reset_output']

    def __init__(self, *args, **kwargs):
        '''

        Args:
            source (str) : python source code

            filename (str) : a filename to use in any debugging or error output

            argv (list[str], optional) : a list of string arguments to make
                available as ``sys.argv`` when the code executes

        '''
        super(CodeHandler, self).__init__(*args, **kwargs)

        if 'source' not in kwargs:
            raise ValueError('Must pass source to CodeHandler')
        source = kwargs['source']

        if 'filename' not in kwargs:
            raise ValueError('Must pass a filename to CodeHandler')
        filename = kwargs['filename']

        argv = kwargs.get('argv', [])

        self._runner = CodeRunner(source, filename, argv)

        self._loggers = {}
        for f in CodeHandler._io_functions:
            self._loggers[f] = self._make_io_logger(f)

    # Properties --------------------------------------------------------------

    @property
    @general((1,0,0))
    def error(self):
        ''' If the handler fails, may contain a related error message.

        '''
        return self._runner.error

    @property
    @general((1,0,0))
    def error_detail(self):
        ''' If the handler fails, may contain a traceback or other details.

        '''
        return self._runner.error_detail

    @property
    @general((1,0,0))
    def failed(self):
        ''' ``True`` if the handler failed to modify the doc

        '''
        return self._runner.failed

    @property
    @general((1,0,0))
    def safe_to_fork(self):
        ''' Whether it is still safe for the Bokeh server to fork new workers.

        ``False`` if the code has already been executed.

        '''
        return not self._runner.ran

    # Public methods ----------------------------------------------------------

    @general((1,0,0))
    def modify_document(self, doc):
        '''

        '''
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

    @general((1,0,0))
    def url_path(self):
        ''' The last path component for the basename of the configured filename.

        '''
        if self.failed:
            return None
        else:
            # TODO should fix invalid URL characters
            return '/' + os.path.splitext(os.path.basename(self._runner.path))[0]

    # Private methods ---------------------------------------------------------

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

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
