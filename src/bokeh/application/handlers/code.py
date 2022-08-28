#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a Bokeh Application Handler to build up documents by compiling
and executing Python source code.

This Handler is used by the Bokeh server command line tool to build
applications that run off scripts and notebooks.

.. code-block:: python

    def make_doc(doc: Document):
        # do work to modify the document, add plots, widgets, etc.
        return doc

    app = Application(FunctionHandler(make_doc))

    server = Server({'/bkapp': app}, io_loop=IOLoop.current())
    server.start()

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from contextlib import contextmanager
from os.path import basename, splitext
from types import ModuleType
from typing import Any, Callable, ClassVar

# Bokeh imports
from ...core.types import PathLike
from ...document import Document
from ...io.doc import curdoc, patch_curdoc
from .code_runner import CodeRunner
from .handler import Handler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CodeHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class CodeHandler(Handler):
    ''' Run source code which modifies a Document

    .. autoclasstoc::

    '''

    # These functions, if present in the supplied code, will be monkey patched
    # to be no-ops, with a warning.
    _io_functions = ['output_notebook', 'output_file', 'show', 'save', 'reset_output']

    _loggers: dict[str, Callable[..., None]]

    _logger_text: ClassVar[str]

    _origin: ClassVar[str]

    def __init__(self, *, source: str, filename: PathLike, argv: list[str] = [], package: ModuleType | None = None) -> None:
        '''

        Args:
            source (str) : python source code

            filename (str) : a filename to use in any debugging or error output

            argv (list[str], optional) : a list of string arguments to make
                available as ``sys.argv`` when the code executes

        '''
        super().__init__()

        self._runner = CodeRunner(source, filename, argv, package=package)

        self._loggers = {}
        for f in CodeHandler._io_functions:
            self._loggers[f] = self._make_io_logger(f)

    # Properties --------------------------------------------------------------

    @property
    def error(self) -> str | None:
        ''' If the handler fails, may contain a related error message.

        '''
        return self._runner.error

    @property
    def error_detail(self) -> str | None:
        ''' If the handler fails, may contain a traceback or other details.

        '''
        return self._runner.error_detail

    @property
    def failed(self) -> bool:
        ''' ``True`` if the handler failed to modify the doc

        '''
        return self._runner.failed

    @property
    def safe_to_fork(self) -> bool:
        ''' Whether it is still safe for the Bokeh server to fork new workers.

        ``False`` if the code has already been executed.

        '''
        return not self._runner.ran

    # Public methods ----------------------------------------------------------

    def modify_document(self, doc: Document) -> None:
        ''' Run Bokeh application code to update a ``Document``

        Args:
            doc (Document) : a ``Document`` to update

        '''

        module = self._runner.new_module()

        # If no module was returned it means the code runner has some permanent
        # unfixable problem, e.g. the configured source code has a syntax error
        if module is None:
            return

        # One reason modules are stored is to prevent the module from being gc'd
        # before the document is. A symptom of a gc'd module is that its globals
        # become None. Additionally stored modules are used to provide correct
        # paths to custom models resolver.
        doc.modules.add(module)

        with _monkeypatch_io(self._loggers):
            with patch_curdoc(doc):
                self._runner.run(module, self._make_post_doc_check(doc))

    def url_path(self) -> str | None:
        ''' The last path component for the basename of the configured filename.

        '''
        if self.failed:
            return None

        # TODO should fix invalid URL characters
        return '/' + splitext(basename(self._runner.path))[0]

    # Private methods ---------------------------------------------------------

    # subclasses must define self._logger_text
    def _make_io_logger(self, name: str) -> Callable[..., None]:
        def logger(*args: Any, **kwargs: Any) -> None:
            log.info(self._logger_text, self._runner.path, name)
        return logger

    # script is supposed to edit the doc not replace it
    def _make_post_doc_check(self, doc: Document) -> Callable[[], None]:
        def func() -> None:
            if curdoc() is not doc:
                raise RuntimeError(f"{self._origin} at {self._runner.path!r} replaced the output document")
        return func

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

# monkeypatching is a little ugly, but in this case there's no reason any legitimate
# code should be calling these functions, and we're only making a best effort to
# warn people so no big deal if we fail.
@contextmanager
def _monkeypatch_io(loggers: dict[str, Callable[..., None]]) -> dict[str, Any]:
    import bokeh.io as io
    old: dict[str, Any] = {}
    for f in CodeHandler._io_functions:
        old[f] = getattr(io, f)
        setattr(io, f, loggers[f])
    yield
    for f in old:
        setattr(io, f, old[f])

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
