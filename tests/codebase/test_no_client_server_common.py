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
from subprocess import PIPE, Popen
from sys import executable

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

BASIC_IMPORTS = [
    "import bokeh.embed",
    "import bokeh.io",
    "import bokeh.models",
    "import bokeh.plotting",
]

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

@pytest.mark.codebase
def test_no_client_server_common():
    ''' Basic usage of Bokeh should not result in any client/server code being
    imported. This test ensures that importing basic modules does not bring in
    bokeh.client or bokeh.server.

    '''
    code = "import sys; %s; sys.exit(1 if any(('bokeh.client' in x or 'bokeh.server' in x) for x in sys.modules.keys()) else 0)"
    proc = Popen([executable, "-c", code % ";".join(BASIC_IMPORTS)],stdout=PIPE)
    proc.wait()
    if proc.returncode != 0:
        assert False
