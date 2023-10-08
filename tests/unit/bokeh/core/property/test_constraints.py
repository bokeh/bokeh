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
    Either,
    Instance,
    Int,
    String,
)
from tests.support.util.api import verify_all

# Module under test
import bokeh.core.property.constraints as bcpc # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    "TypeOfAttr",
)

class Child0(HasProps, Local):
    pass
class Child1(Child0, Local):
    pass
class Child2(HasProps, Local):
    pass

class Parent(HasProps, Local):
    p0 = Either(Instance(Child0), Instance(Child2))
    p1 = Either(Int, String)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_TypeOfAttr:

    def test___str__(self) -> None:
        prop = bcpc.TypeOfAttr(Instance(Parent), "p0", Instance(Child0))
        assert str(prop) == "TypeOfAttr(Instance(Parent), 'p0', Instance(Child0))"

    def test_is_valid(self) -> None:
        prop0 = bcpc.TypeOfAttr(Instance(Parent), "p0", Instance(Child0))
        prop1 = bcpc.TypeOfAttr(Instance(Parent), "p0", Instance(Child1))
        prop2 = bcpc.TypeOfAttr(Instance(Parent), "p0", Instance(Child2))
        prop3 = bcpc.TypeOfAttr(Instance(Parent), "p1", Int)
        prop4 = bcpc.TypeOfAttr(Instance(Parent), "p1", String)
        prop5 = bcpc.TypeOfAttr(Instance(Parent), "p2", String)

        assert prop0.is_valid(Parent(p0=Child0())) is True
        assert prop0.is_valid(Parent(p0=Child1())) is True
        assert prop0.is_valid(Parent(p0=Child2())) is False

        assert prop1.is_valid(Parent(p0=Child0())) is False
        assert prop1.is_valid(Parent(p0=Child1())) is True
        assert prop1.is_valid(Parent(p0=Child2())) is False

        assert prop2.is_valid(Parent(p0=Child0())) is False
        assert prop2.is_valid(Parent(p0=Child1())) is False
        assert prop2.is_valid(Parent(p0=Child2())) is True

        assert prop3.is_valid(Parent(p0=Child0(), p1=0)) is True
        assert prop3.is_valid(Parent(p0=Child1(), p1="")) is False

        assert prop4.is_valid(Parent(p0=Child0(), p1=0)) is False
        assert prop4.is_valid(Parent(p0=Child1(), p1="")) is True

        assert prop5.is_valid(Parent(p0=Child1(), p1="")) is False

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpc, ALL)
