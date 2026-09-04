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

# Standard library imports
import sys
from types import ModuleType

# Bokeh imports
import bokeh.io.notebook as binb
from tests.support.util.api import verify_all

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------


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

def test_legacy_colab_import_hook_is_ignored(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setitem(sys.modules, "google.colab._import_hooks._bokeh", ModuleType("_bokeh"))

    install = getattr(binb, "install_notebook_hook")
    assert install("jupyter", object(), object(), object(), overwrite=True) is None

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
