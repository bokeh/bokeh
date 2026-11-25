#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from copy import copy, deepcopy
from typing import TYPE_CHECKING, Any

import pytest

from bokeh.core.has_props import HasProps, Local
from bokeh.core.properties import (
    AngleSpec,
    ColorSpec,
    Dict,
    DistanceSpec,
    Float,
    Instance,
    Int,
    List,
    Nothing,
    String,
    StringSpec,
)
from bokeh.core.property.descriptors import DataSpecPropertyDescriptor
from bokeh.core.property.vectorization import Expr, Field, Value
from bokeh.core.property.wrappers import PropertyValueDict, PropertyValueList
from bokeh.core.property_aliases import AngleUnits, SpatialUnits
from bokeh.models import CumSum, CustomJSTransform
from tests.support.util.api import verify_all

from _util_property import _TestHasProps, _TestModel

if TYPE_CHECKING:
    from bokeh.core.has_props import HasProps

# Module under test
import bokeh.core.property.nullable as bcpn # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    "Nullable",
    "NullableProp",
    "NullableSpec",
)


class NullableSpecs(HasProps, Local):
    angle = bcpn.Nullable(AngleSpec)
    angle_units = AngleUnits
    distance = bcpn.Nullable(DistanceSpec)
    distance_units = SpatialUnits
    text = bcpn.Nullable(StringSpec)


class Test_NullableDataSpec:
    def test_help_preserved_by_descriptor_and_discovery(self) -> None:
        class Props(HasProps, Local):
            text = bcpn.Nullable(StringSpec, help="Nullable text help.")

        descriptor = Props.lookup("text")
        assert descriptor.__doc__ == "Nullable text help."
        assert descriptor.property.help == descriptor.__doc__
        assert Props.dataspecs()["text"].help == descriptor.__doc__

    def test_descriptor_and_discovery(self) -> None:
        assert set(NullableSpecs.dataspecs()) == {"angle", "distance", "text"}
        descriptor = NullableSpecs.lookup("angle")
        assert isinstance(descriptor, DataSpecPropertyDescriptor)
        assert isinstance(descriptor.property, bcpn.Nullable)
        assert isinstance(descriptor.property.type_param, AngleSpec)
        assert NullableSpecs.dataspecs()["angle"]._default is None
        assert descriptor.get_value(NullableSpecs()) == Value(None)
        assert NullableSpecs().properties_with_values() == {"angle": Value(None), "distance": Value(None), "text": Value(None)}

    @pytest.mark.parametrize(("value", "expected"), [
        (None, Value(None)),
        (Value(None), Value(None)),
        ({"value": None}, Value(None)),
        (2, Value(2)),
        ("angles", Field("angles")),
        (Field("angles"), Field("angles")),
        ({"field": "angles"}, Field("angles")),
    ])
    def test_values(self, value, expected) -> None:
        obj = NullableSpecs(angle=value)
        assert obj.lookup("angle").get_value(obj) == expected

    def test_expression_and_transform(self) -> None:
        expr = CumSum(field="angles")
        transform = CustomJSTransform()
        obj = NullableSpecs(angle={"expr": expr, "transform": transform})
        assert obj.lookup("angle").get_value(obj) == Expr(expr, transform=transform)
        obj.angle = expr
        assert obj.angle == Expr(expr)
        obj.angle = {"value": None, "transform": transform}
        assert obj.lookup("angle").get_value(obj) == Value(None, transform=transform)

    def test_units_and_updates(self) -> None:
        obj = NullableSpecs(angle={"value": None, "units": "deg"})
        assert obj.angle_units == "deg"
        assert obj.lookup("angle").get_value(obj) == Value(None, units="deg")
        obj.lookup("angle").set_from_json(obj, {"field": "angles", "units": "turn"})
        assert obj.lookup("angle").get_value(obj) == Field("angles", units="turn")
        obj.angle = None
        assert obj.angle is None
        assert obj.lookup("angle").get_value(obj) == Value(None, units="turn")

    def test_nonnullable_spec_rejects_none(self) -> None:
        with pytest.raises(ValueError):
            AngleSpec().validate(None)

    def test_distance_rejects_negative_value(self) -> None:
        with pytest.raises(ValueError):
            NullableSpecs(distance=-1)

    def test_angle_rejects_invalid_value(self) -> None:
        with pytest.raises(ValueError):
            NullableSpecs(angle=[])

    def test_string_accepts_explicit_null_value(self) -> None:
        assert NullableSpecs(text={"value": None}).text == Value(None)

    @pytest.mark.parametrize("spec_type", [AngleSpec, DistanceSpec, StringSpec, ColorSpec])
    def test_composition_preserves_original(self, spec_type) -> None:
        prop = bcpn.Nullable(spec_type)
        prop.validate(None)
        prop.validate({"value": None})
        # ColorSpec already accepts None, so wrapping it is harmless.
        # The other specs must still reject None when used without the wrapper.
        if spec_type is not ColorSpec:
            with pytest.raises(ValueError):
                prop.type_param.validate(None)

    def test_units_declaration_required(self) -> None:
        with pytest.raises(TypeError, match="angle_units = AngleUnits"):
            class MissingUnits(HasProps, Local):
                angle = bcpn.Nullable(AngleSpec)

    def test_nested_nullable(self) -> None:
        class Nested(HasProps, Local):
            text = bcpn.Nullable(bcpn.Nullable(StringSpec))
        assert set(Nested.dataspecs()) == {"text"}
        assert Nested.lookup("text").get_value(Nested()) == Value(None)

    def test_transform_runs_once(self) -> None:
        class OffsetAngleSpec(AngleSpec):
            def transform(self, value: Any) -> Any:
                result = super().transform(value)
                return result + 1 if isinstance(result, (int, float)) else result

        class Props(HasProps, Local):
            angle = bcpn.Nullable(OffsetAngleSpec)
            angle_units = AngleUnits

        obj = Props(angle=10)
        assert obj.angle == 11
        obj.angle = 20
        assert obj.angle == 21
        obj.angle = None
        assert obj.angle is None

    def test_outer_accepts(self) -> None:
        prop = bcpn.Nullable(AngleSpec).accepts(List(Float), lambda values: values[0])

        class Props(HasProps, Local):
            angle = prop
            angle_units = AngleUnits

        obj = Props(angle=[10])
        assert obj.angle == 10
        obj.angle = CumSum(field="angles")
        assert isinstance(obj.angle, Expr)

    def test_assertions_run_once(self) -> None:
        seen = []

        def record(obj: HasProps, value: Any) -> bool:
            seen.append(value)
            return True

        class Props(HasProps, Local):
            angle = bcpn.Nullable(AngleSpec).asserts(record, "record value")
            angle_units = AngleUnits

        Props(angle=10)
        assert seen == [10]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Nullable:
    @pytest.mark.parametrize(("wrapper", "type_param"), [
        (bcpn.NullableProp, AngleSpec),
        (bcpn.NullableProp, AngleSpec()),
        (bcpn.NullableProp, StringSpec(default=None)),
        (bcpn.NullableProp, bcpn.Nullable(AngleSpec)),
        (bcpn.NullableSpec, Int),
        (bcpn.NullableSpec, Int()),
    ])
    def test_direct_construction_rejects_mismatched_property(self, wrapper, type_param) -> None:
        with pytest.raises(TypeError, match=r"Use Nullable\(\.\.\.\)"):
            wrapper(type_param)

    @pytest.mark.parametrize(("wrapper", "type_param"), [
        (bcpn.NullableProp, Int),
        (bcpn.NullableSpec, AngleSpec),
    ])
    def test_direct_construction_accepts_matching_property(self, wrapper, type_param) -> None:
        wrapper(type_param).validate(None)

    @pytest.mark.parametrize(("type_param", "old", "new", "implementation"), [
        (StringSpec, StringSpec, String(), bcpn.NullableProp),
        (String, String, StringSpec(default=None), bcpn.NullableSpec),
    ])
    def test_replace_redispatches(self, type_param, old, new, implementation) -> None:
        result = bcpn.Nullable(type_param).replace(old, new)
        assert type(result) is implementation
        assert result.type_param is new
        result.validate(None)

    @pytest.mark.parametrize("type_param", [Int, AngleSpec])
    def test_replace_nullable_base(self, type_param) -> None:
        replacement = Nothing()
        assert bcpn.Nullable(type_param).replace(bcpn.Nullable, replacement) is replacement

    @pytest.mark.parametrize(("type_param", "implementation"), [
        (Int, bcpn.NullableProp),
        (Int(), bcpn.NullableProp),
        (AngleSpec, bcpn.NullableSpec),
        (AngleSpec(), bcpn.NullableSpec),
        (bcpn.Nullable(StringSpec), bcpn.NullableSpec),
    ])
    def test_dispatch(self, type_param, implementation) -> None:
        prop = bcpn.Nullable(type_param)
        assert type(prop) is implementation
        assert isinstance(prop, bcpn.Nullable)
        assert str(prop).startswith("Nullable(")

    @pytest.mark.parametrize("type_param", [Int, AngleSpec])
    @pytest.mark.parametrize("clone", [copy, deepcopy, lambda prop: prop()])
    def test_copy_preserves_dispatch(self, type_param, clone) -> None:
        prop = bcpn.Nullable(type_param)
        cloned = clone(prop)
        assert cloned is not prop
        assert type(cloned) is type(prop)
        assert isinstance(cloned, bcpn.Nullable)
        cloned.validate(None)

    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpn.Nullable()
        with pytest.raises(ValueError):
            bcpn.Nullable(Int(help="inner help"))

        prop0 = bcpn.Nullable(Int(), help="help")
        assert prop0._help == prop0.__doc__ == "help"

    def test_eq(self) -> None:
        assert (bcpn.Nullable(Int) == int | None) is False

        assert (bcpn.Nullable(Int) == bcpn.Nullable(Int)) is True
        assert (bcpn.Nullable(Int()) == bcpn.Nullable(Int)) is True
        assert (bcpn.Nullable(Int) == bcpn.Nullable(Int())) is True
        assert (bcpn.Nullable(Int()) == bcpn.Nullable(Int())) is True

        assert (bcpn.Nullable(Int(0)) == bcpn.Nullable(Int())) is True
        assert (bcpn.Nullable(Int()) == bcpn.Nullable(Int(0))) is True
        assert (bcpn.Nullable(Int(0)) == bcpn.Nullable(Int(0))) is True

        assert (bcpn.Nullable(Int(1)) == bcpn.Nullable(Int(0))) is False
        assert (bcpn.Nullable(Int(0)) == bcpn.Nullable(Int(1))) is False
        assert (bcpn.Nullable(Int(1)) == bcpn.Nullable(Int(1))) is True

        assert (bcpn.Nullable(Int, help="helpful") == bcpn.Nullable(Int)) is False
        assert (bcpn.Nullable(Int) == bcpn.Nullable(Int, help="helpful")) is False
        assert (bcpn.Nullable(Int, help="helpful") == bcpn.Nullable(Int, help="helpful")) is True

        assert (bcpn.Nullable(Int, default=10) == bcpn.Nullable(Int)) is False
        assert (bcpn.Nullable(Int) == bcpn.Nullable(Int, default=10)) is False
        assert (bcpn.Nullable(Int, default=10) == bcpn.Nullable(Int, default=10)) is True

        def f(s: str) -> int:
            return int(s)

        assert (bcpn.Nullable(Int).accepts(String, f) == bcpn.Nullable(Int)) is False
        assert (bcpn.Nullable(Int) == bcpn.Nullable(Int).accepts(String, f)) is False
        assert (bcpn.Nullable(Int).accepts(String, f) == bcpn.Nullable(Int).accepts(String, f)) is True

        def g(_o: HasProps, v: int | None) -> bool:
            return v is not None and v >= 0

        assert (bcpn.Nullable(Int).asserts(g, ">= 0") == bcpn.Nullable(Int)) is False
        assert (bcpn.Nullable(Int) == bcpn.Nullable(Int).asserts(g, ">= 0")) is False
        assert (bcpn.Nullable(Int).asserts(g, ">= 0") == bcpn.Nullable(Int).asserts(g, ">= 0")) is True

    def test_clone(self) -> None:
        p0 = bcpn.Nullable(Int)
        c0 = p0()

        assert c0.default is None
        assert c0.help is None
        assert c0.alternatives == []
        assert c0.assertions == []

        assert p0 is not c0
        assert p0 == c0
        assert c0.type_params == p0.type_params

        p1 = bcpn.Nullable(Int, default=10, help="helpful")
        c1 = p1()

        assert c1.default == 10
        assert c1.help == "helpful"
        assert c1.alternatives == []
        assert c1.assertions == []

        assert p1 is not c1
        assert p1 == c1
        assert c1.type_params == p1.type_params

        p2 = bcpn.Nullable(Int)
        c2 = p2(default=20, help="helpful")

        assert c2.default == 20
        assert c2.help == "helpful"
        assert c2.alternatives == []
        assert c2.assertions == []

        assert p2 is not c2
        assert p2 != c2
        assert c2.type_params == p2.type_params

        p3 = bcpn.Nullable(Int, default=10, help="helpful")
        c3 = p3(default=20, help="unhelpful")

        assert c3.default == 20
        assert c3.help == "unhelpful"
        assert c3.alternatives == []
        assert c3.assertions == []

        assert p3 is not c3
        assert p3 != c3
        assert c3.type_params == p3.type_params

    def test_valid(self) -> None:
        prop = bcpn.Nullable(List(Int))

        assert prop.is_valid(None)

        assert prop.is_valid([])
        assert prop.is_valid([1, 2, 3])

    def test_invalid(self) -> None:
        prop = bcpn.Nullable(List(Int))

        assert not prop.is_valid(-100)
        assert not prop.is_valid("yyy")
        assert not prop.is_valid([1, 2, ""])

        assert not prop.is_valid(())
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_has_ref(self) -> None:
        prop0 = bcpn.Nullable(Int)
        assert not prop0.has_ref
        prop1 = bcpn.Nullable(Instance(_TestModel))
        assert prop1.has_ref

    def test_str(self) -> None:
        prop = bcpn.Nullable(List(Int))
        assert str(prop) == "Nullable(List(Int))"

    def test_wrap_dict(self) -> None:
        prop = bcpn.Nullable(Dict(String, Int))
        assert prop.wrap(None) is None
        wrapped = prop.wrap({"foo": 10})
        assert isinstance(wrapped, PropertyValueDict)
        assert prop.wrap(wrapped) is wrapped

    def test_wrap_list(self) -> None:
        prop = bcpn.Nullable(List(Int))
        assert prop.wrap(None) is None
        wrapped = prop.wrap([10, 20])
        assert isinstance(wrapped, PropertyValueList)
        assert prop.wrap(wrapped) is wrapped

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpn, ALL)
