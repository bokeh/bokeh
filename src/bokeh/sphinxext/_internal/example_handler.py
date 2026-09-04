# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations

import logging  # isort:skip
log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING, Any

# Bokeh imports
from bokeh.application.handlers.code_runner import CodeRunner
from bokeh.application.handlers.handler import Handler
from bokeh.io.doc import curdoc, set_curdoc

if TYPE_CHECKING:
    from types import ModuleType

    from bokeh.core.types import PathLike
    from bokeh.document import Document

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "ExampleHandler",
)

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

    _output_funcs: list[str] = []
    _io_funcs = ["show", "save"]

    def __init__(self, source: str, filename: PathLike) -> None:
        super().__init__()
        self._runner = CodeRunner(source, filename, ())

    def modify_document(self, doc: Document) -> None:
        if self.failed:
            return

        module = self._runner.new_module()
        assert module is not None

        doc.modules.add(module)

        orig_curdoc = curdoc()
        set_curdoc(doc)

        old_funcs, old_doc = self._monkeypatch()

        try:
            self._runner.run(module, lambda: None)
        finally:
            self._unmonkeypatch(old_funcs, old_doc)
            set_curdoc(orig_curdoc)

    def _monkeypatch(self) -> tuple[list[tuple[ModuleType, str, Any]], type[Document]]:
        def _pass(*args: Any, **kw: Any) -> None:
            pass

        def _add_root(obj: Any, *args: Any, **kw: Any) -> None:
            curdoc().add_root(obj)

        def _curdoc(*args: Any, **kw: Any) -> Document:
            return curdoc()

        # These functions are transitively imported from io into plotting, so
        # patch both modules.
        import bokeh.io as io
        import bokeh.plotting as p

        mods: list[ModuleType] = [io, p]

        old_funcs: list[tuple[ModuleType, str, Any]] = []
        for mod in mods:
            for f in self._output_funcs:
                old_funcs.append((mod, f, getattr(mod, f)))
                setattr(mod, f, _pass)
            for f in self._io_funcs:
                old_funcs.append((mod, f, getattr(mod, f)))
                setattr(mod, f, _add_root)

        import bokeh.document as d

        old_doc = d.Document
        d.Document = _curdoc # type: ignore[assignment,misc]

        return old_funcs, old_doc

    def _unmonkeypatch(self, old_funcs: list[tuple[ModuleType, str, Any]], old_doc: type[Document]) -> None:
        for mod, name, value in old_funcs:
            setattr(mod, name, value)

        import bokeh.document as d

        d.Document = old_doc # type: ignore[misc]

    @property
    def failed(self) -> bool:
        return self._runner.failed

    @property
    def error(self) -> str | None:
        return self._runner.error

    @property
    def error_detail(self) -> str | None:
        return self._runner.error_detail

    @property
    def doc(self) -> str | None:
        return self._runner.doc

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
