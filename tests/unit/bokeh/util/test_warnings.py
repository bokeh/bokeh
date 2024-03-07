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

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from unittest.mock import MagicMock, patch

# Bokeh imports
import bokeh.util.deprecation as dep

# Module under test
import bokeh.util.warnings as warn # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@patch('warnings.warn')
def test_find_stack_level(mock_warn: MagicMock) -> None:
    assert warn.find_stack_level() == 1

    warn.warn("test")
    assert mock_warn.call_count == 1
    assert mock_warn.call_args[1] == {'stacklevel': 2}

    dep.deprecated((1,2,3), old="foo", new="bar", extra="baz")
    assert mock_warn.call_count == 2
    assert mock_warn.call_args[1] == {'stacklevel': 3}
