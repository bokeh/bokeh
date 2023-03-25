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

# Bokeh imports
from tests.support.util.api import verify_all

# Module under test
import bokeh.core.property.alias as bcpa # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    "Alias",
    "DeprecatedAlias",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Alias:
    def test_create_default(self) -> None:
        alias = bcpa.Alias("width", help="Object's width")
        assert alias.aliased_name == "width"
        assert alias.help == "Object's width"

class Test_DeprecatedAlias:
    def test_create_default(self) -> None:
        alias = bcpa.DeprecatedAlias("width", since=(3, 1, 0), help="Object's width")
        assert alias.aliased_name == "width"
        assert alias.since == (3, 1, 0)
        assert alias.help == "Object's width"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpa, ALL)
