#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
import bokeh.io.notebook as binb
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.io as bi

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'curdoc',
    'export_png',
    'export_svgs',
    'install_notebook_hook',
    'push_notebook',
    'output_file',
    'output_notebook',
    'save',
    'show',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bi, ALL)

def test_jupyter_notebook_hook_installed():
    assert list(binb._HOOKS) == ["jupyter"]
    assert binb._HOOKS["jupyter"]['load'] == binb.load_notebook
    assert binb._HOOKS["jupyter"]['doc']  == binb.show_doc
    assert binb._HOOKS["jupyter"]['app']  == binb.show_app
