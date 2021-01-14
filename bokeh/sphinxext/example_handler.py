# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
import sys

# Bokeh imports
from bokeh.application.handlers.code_runner import CodeRunner
from bokeh.application.handlers.handler import Handler
from bokeh.io.doc import curdoc, set_curdoc

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = ("ExampleHandler",)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


class ExampleHandler(Handler):
    """A stripped-down handler similar to CodeHandler but that does
    some appropriate monkeypatching.

    """

    _output_funcs = ["output_notebook", "output_file", "reset_output"]
    _io_funcs = ["show", "save"]

    def __init__(self, source, filename):
        super().__init__(self)
        self._runner = CodeRunner(source, filename, [])

    def modify_document(self, doc):
        if self.failed:
            return

        module = self._runner.new_module()

        sys.modules[module.__name__] = module
        doc._modules.append(module)

        orig_curdoc = curdoc()
        set_curdoc(doc)

        old_io, old_doc = self._monkeypatch()

        try:
            self._runner.run(module, lambda: None)
        finally:
            self._unmonkeypatch(old_io, old_doc)
            set_curdoc(orig_curdoc)

    def _monkeypatch(self):
        def _pass(*args, **kw):
            pass

        def _add_root(obj, *args, **kw):
            curdoc().add_root(obj)

        def _curdoc(*args, **kw):
            return curdoc()

        # these functions are transitively imported from io into plotting,
        # so we have to patch them all. Assumption is that no other patching
        # has occurred, i.e. we can just save the funcs being patched once,
        # from io, and use those as the originals to replace everywhere
        import bokeh.io as io  # lgtm [py/import-and-import-from]
        import bokeh.plotting as p

        mods = [io, p]

        old_io = {}
        for f in self._output_funcs + self._io_funcs:
            old_io[f] = getattr(io, f)

        for mod in mods:
            for f in self._output_funcs:
                setattr(mod, f, _pass)
            for f in self._io_funcs:
                setattr(mod, f, _add_root)

        import bokeh.document as d

        old_doc = d.Document
        d.Document = _curdoc

        return old_io, old_doc

    def _unmonkeypatch(self, old_io, old_doc):
        import bokeh.io as io  # lgtm [py/import-and-import-from]
        import bokeh.plotting as p

        mods = [io, p]

        for mod in mods:
            for f in old_io:
                setattr(mod, f, old_io[f])

        import bokeh.document as d

        d.Document = old_doc

    @property
    def failed(self):
        return self._runner.failed

    @property
    def error(self):
        return self._runner.error

    @property
    def error_detail(self):
        return self._runner.error_detail


# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
