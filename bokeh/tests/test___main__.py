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
from mock import patch

# External imports

# Bokeh imports
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.__main__ as bm

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL =  (
    'main',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bm, ALL)

@patch('bokeh.command.bootstrap.main')
def test_main(mock_main):
    import sys
    old_argv = sys.argv
    sys.argv = ["foo", "bar"]
    bm.main()
    assert mock_main.call_count == 1
    assert mock_main.call_args[0] == (["foo", "bar"],)
    assert mock_main.call_args[1] == {}
    sys.argv = old_argv
