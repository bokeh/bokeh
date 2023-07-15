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
from bokeh.core.has_props import HasProps, Local
from bokeh.core.properties import (
    Auto,
    Dict,
    Either,
    Instance,
    Int,
    List,
    Nullable,
)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_issue_11852() -> None:
    class Test01(HasProps, Local):
        p0 = Either(List(Instance(HasProps)), Auto)
        p1 = Nullable(Either(Dict(Int, Instance(HasProps)), List(Instance(HasProps))), default={})

    obj0 = Test01()
    obj1 = Test01()

    assert obj0.p0 == []
    assert obj1.p0 == []
    assert obj0.p1 == {}
    assert obj1.p1 == {}

    obj0.p0.append(obj1)

    assert obj0.p0 == [obj1]
    assert obj1.p0 == []
    assert obj0.p1 == {}
    assert obj1.p1 == {}

    obj0.p1[100] = obj1

    assert obj0.p0 == [obj1]
    assert obj1.p0 == []
    assert obj0.p1 == {100: obj1}
    assert obj1.p1 == {}

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
