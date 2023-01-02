#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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

# Standard library imports
from unittest.mock import MagicMock, patch

# Bokeh imports
from tests.support.util.api import verify_all

# Module under test
import bokeh.__main__ as bm # isort:skip

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
def test_main(mock_main: MagicMock) -> None:
    import sys
    old_argv = sys.argv
    sys.argv = ["foo", "bar"]
    bm.main()
    assert mock_main.call_count == 1
    assert mock_main.call_args[0] == (["foo", "bar"],)
    assert mock_main.call_args[1] == {}
    sys.argv = old_argv

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
