#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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

# Standard library imports
from subprocess import run
from sys import executable as python

# Bokeh imports
from tests.support.util.project import verify_clean_imports

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

modules = [
    "bokeh.embed",
    "bokeh.io",
    "bokeh.models",
    "bokeh.plotting",
]

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

def test_no_client_server_or_tornado_common() -> None:
    ''' Basic usage of Bokeh should not result in any client, server, or Tornado code
    being imported. This test ensures that importing basic modules does not
    bring in bokeh.client, bokeh.server, or tornado.

    '''
    targets = ("bokeh.client", "bokeh.server", "tornado")
    proc = run([python, "-c", verify_clean_imports(targets, modules)], capture_output=True, text=True)
    assert proc.returncode == 0, f"client, server, or Tornado modules imported in common modules:\n{proc.stdout}"
