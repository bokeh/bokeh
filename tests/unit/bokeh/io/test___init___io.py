#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import sys
from types import ModuleType

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
import bokeh.io.notebook as binb
from tests.support.util.api import verify_all

# Module under test
import bokeh.io as bi # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'curdoc',
    'export_png',
    'export_svg',
    'export_svgs',
    'NotebookApplication',
    'notebook_info',
    'output_file',
    'reset_output',
    'save',
    'serve',
    'show',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bi, ALL)

def test_removed_manual_notebook_api_is_not_exposed() -> None:
    assert not hasattr(bi, "push_notebook")
    assert not hasattr(bi, "notebook_status")
    assert not hasattr(binb, "push_notebook")
    assert not hasattr(bi, "install_notebook_hook")
    assert not hasattr(binb, "install_notebook_hook")
    assert not hasattr(binb, "run_notebook_hook")
    assert not hasattr(binb, "load_notebook")
    assert not hasattr(binb, "show_app")
    assert not hasattr(binb, "get_comms")
    assert not hasattr(binb, "_HOOKS")

def test_legacy_colab_import_hook_is_ignored(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setitem(sys.modules, "google.colab._import_hooks._bokeh", ModuleType("_bokeh"))

    install = getattr(binb, "install_notebook_hook")
    install("jupyter", object(), object(), object(), overwrite=True)

    assert not hasattr(binb, "_HOOKS")
    assert not hasattr(binb, "run_notebook_hook")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
