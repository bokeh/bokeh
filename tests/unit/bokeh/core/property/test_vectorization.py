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
from bokeh.core.serialization import Deserializer, Serializer
from bokeh.models.expressions import CumSum
from bokeh.models.transforms import Dodge
from tests.support.util.api import verify_all

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


def test_compact_serialization() -> None:
    serializer = Serializer(compact=True, models_with_ids=set())
    deserializer = Deserializer()

    assert serializer.encode(bcpv.Value("firebrick")) == "firebrick"
    value = serializer.encode(bcpv.Value("firebrick", units="data"))
    assert value == {"$value": "firebrick", "units": "data"}
    assert deserializer.deserialize(value) == bcpv.Value("firebrick", units="data")

    assert serializer.encode(bcpv.Field("x")) == {"$field": "x"}
    field = serializer.encode(bcpv.Field("x", transform=Dodge(value=1)))
    assert field["$field"] == "x"
    assert field["transform"]["$type"] == "Dodge"
    decoded_field = deserializer.deserialize(field)
    assert isinstance(decoded_field, bcpv.Field)
    assert isinstance(decoded_field.transform, Dodge)
    assert decoded_field.transform.value == 1

    expr = serializer.encode(bcpv.Expr(CumSum(field="x"), units="data"))
    assert expr == {"$expr": {"$type": "CumSum", "field": "x"}, "units": "data"}
    decoded_expr = deserializer.deserialize(expr)
    assert isinstance(decoded_expr, bcpv.Expr)
    assert isinstance(decoded_expr.expr, CumSum)
    assert decoded_expr.expr.field == "x"
    assert decoded_expr.units == "data"

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
