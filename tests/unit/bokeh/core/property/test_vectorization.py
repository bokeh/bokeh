#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
from bokeh._testing.util.api import verify_all
from bokeh.models.expressions import CumSum
from bokeh.models.transforms import Dodge

# Module under test
import bokeh.core.property.vectorization as bcpv # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
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
    assert bcpv.field("foo") == bcpv.Field(field="foo")
    assert bcpv.field("foo", transform) == bcpv.Field(field="foo", transform=transform)
    assert bcpv.field("foo", transform=transform) == bcpv.Field(field="foo", transform=transform)

def test_expr_function() -> None:
    expr = CumSum(field="foo")
    transform = Dodge()
    assert bcpv.expr(expr) == bcpv.Expr(expr=expr)
    assert bcpv.expr(expr, transform) == bcpv.Expr(expr=expr, transform=transform)
    assert bcpv.expr(expr, transform=transform) == bcpv.Expr(expr=expr, transform=transform)

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
