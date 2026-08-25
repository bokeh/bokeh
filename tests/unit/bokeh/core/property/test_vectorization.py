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

# Bokeh imports
from bokeh.models.expressions import CumSum
from bokeh.models.transforms import Dodge
from tests.support.util.api import verify_all

# Module under test
import bokeh.core.property.vectorization as bcpv # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    "DataSpecValue",
    "Expr",
    "Field",
    "Value",
    "expr",
    "field",
    "value",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_value_function() -> None:
    transform = Dodge()
    assert bcpv.value("foo") == bcpv.Value(value="foo")
    assert bcpv.value("foo", transform) == bcpv.Value(value="foo", transform=transform)
    assert bcpv.value("foo", transform=transform) == bcpv.Value(value="foo", transform=transform)

def test_field_function() -> None:
    transform = Dodge()
    assert bcpv.field("foo") == bcpv.Field(value="foo")
    assert bcpv.field("foo", transform) == bcpv.Field(value="foo", transform=transform)
    assert bcpv.field("foo", transform=transform) == bcpv.Field(value="foo", transform=transform)

def test_expr_function() -> None:
    expression = CumSum(field="foo")
    transform = Dodge()
    assert bcpv.expr(expression) == bcpv.Expr(value=expression)
    assert bcpv.expr(expression, transform) == bcpv.Expr(value=expression, transform=transform)
    assert bcpv.expr(expression, transform=transform) == bcpv.Expr(value=expression, transform=transform)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpv, ALL)
