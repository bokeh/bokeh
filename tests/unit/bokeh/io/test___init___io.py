#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
import bokeh.io.notebook as binb
from bokeh._testing.util.api import verify_all

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
    'install_notebook_hook',
    'push_notebook',
    'output_file',
    'output_notebook',
    'reset_output',
    'save',
    'show',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bi, ALL)

def test_jupyter_notebook_hook_installed() -> None:
    assert list(binb._HOOKS) == ["jupyter"]
    assert binb._HOOKS["jupyter"]['load'] == binb.load_notebook
    assert binb._HOOKS["jupyter"]['doc']  == binb.show_doc
    assert binb._HOOKS["jupyter"]['app']  == binb.show_app

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
