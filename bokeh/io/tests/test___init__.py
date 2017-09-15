#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

from bokeh.util.api import INTERNAL, PUBLIC ; INTERNAL, PUBLIC
from bokeh.util.testing import verify_api ; verify_api

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
import bokeh.io.notebook as binb
import bokeh.io.showing as bis

# Module under test
#import bokeh.io as bi

def test_jupyter_notebook_hook_installed():
    assert list(binb._HOOKS) == ["jupyter"]
    assert binb._HOOKS["jupyter"]['load'] == bis.load_notebook
    assert binb._HOOKS["jupyter"]['doc'] == bis._show_jupyter_doc_with_state
    assert binb._HOOKS["jupyter"]['app'] == bis._show_jupyter_app_with_state
