#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from subprocess import PIPE, Popen
from sys import executable

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

BASIC_IMPORTS = [
    "import bokeh.client",
    "import bokeh.embed",
    "import bokeh.io",
    "import bokeh.models",
    "import bokeh.plotting",
]

def test_no_tornado_common() -> None:
    ''' Basic usage of Bokeh should not result in any Tornado code being
    imported. This test ensures that importing basic modules does not bring in
    Tornado.

    '''
    proc = Popen([
        executable, "-c", "import sys; %s; sys.exit(1 if any('tornado' in x for x in sys.modules.keys()) else 0)" % ";".join(BASIC_IMPORTS)
    ],stdout=PIPE)
    proc.communicate()
    proc.wait()
    if proc.returncode != 0:
        assert False
