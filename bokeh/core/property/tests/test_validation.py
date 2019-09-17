#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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
import re

# External imports

# Bokeh imports
from bokeh.core.property.bases import validation_on
from bokeh.core.has_props import HasProps
from bokeh.core.properties import (
    Angle, AngleSpec, Bool, Color, ColorSpec, ColumnData, Complex, DashPattern, DataDistanceSpec, Date, DistanceSpec, Dict,
    Either, Enum, FontSize, FontSizeSpec, Int, Instance, Interval, Float, List, MarkerType, MinMaxBounds, NumberSpec, Percent,
    Regex, ScreenDistanceSpec, Seq, Size, String, StringSpec, Tuple)
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.property.validation as bcpv

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'validate',
    'without_property_validation',
)

SPECS = (
    AngleSpec,
    ColorSpec,
    DataDistanceSpec,
    DistanceSpec,
    FontSizeSpec,
    NumberSpec,
    ScreenDistanceSpec,
    StringSpec,
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestValidationControl(object):

    def test_validate(self):
        assert validation_on()
        with bcpv.validate(False):
            assert not validation_on()
        assert validation_on()

        with bcpv.validate(False):
            assert not validation_on()
            with bcpv.validate(True):
                assert validation_on()
            assert not validation_on()
        assert validation_on()

        bcpv.validate(False)
        assert not validation_on()
        bcpv.validate(True)
        assert validation_on()

    def test_without_property_validation(self):
        @bcpv.without_property_validation
        def f():
            assert not validation_on()

        assert validation_on()
        f()
        assert validation_on()

class TestValidateDetailDefault(object):

    # test_Any unecessary (no validation)

    # TODO (bev) test_Image

    def test_Angle(self):
        p = Angle()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected a value of type Real, got junk of type (str|unicode)")
    def test_Bool(self):
        p = Bool()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected a value of type bool or bool_, got junk of type (str|unicode)")
    def test_Complex(self):
        p = Complex()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected a value of type Complex, got junk of type (str|unicode)")
    def test_Float(self):
        p = Float()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected a value of type Real, got junk of type (str|unicode)")
    def test_Int(self):
        p = Int()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected a value of type Integral, got junk of type (str|unicode)")
    def test_Interval(self):
        p = Interval(Float, 0.0, 1.0)
        with pytest.raises(ValueError) as e:
            p.validate(2)
        assert matches(str(e.value), r"expected a value of type Float in range \[0.0, 1.0\], got 2")
    def test_Percent(self):
        p = Percent()
        with pytest.raises(ValueError) as e:
            p.validate(10)
        assert matches(str(e.value), r"expected a value in range \[0, 1\], got 10")
    def test_Size(self):
        p = Size()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected a value of type Real, got junk of type (str|unicode)")


    def test_List(self):
        p = List(Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected an element of List\(Float\), got u?'junk'")
    def test_Seq(self):
        p = Seq(Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected an element of Seq\(Float\), got u?'junk'")
    def test_Dict(self):
        p = Dict(String, Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected an element of Dict\(String, Float\), got u?'junk'")
    def test_Tuple(self):
        p = Tuple(Int, Int)
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected an element of Tuple\(Int, Int\), got u?'junk'")


    def test_Color(self):
        p = Color()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected an element of either Enum\(.*\), .* or RGB, got u?'junk'")
    def test_ColumnData(self):
        p = ColumnData(String, Seq(Float))
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected an element of ColumnData\(String, Seq\(Float\)\), got u?'junk'")
    def test_Date(self):
        p = Date()
        with pytest.raises(ValueError) as e:
            p.validate(object())
        assert matches(str(e.value), r"expected a date, string or timestamp, got <object object at 0x.*>")
    def test_DashPattern(self):
        p = DashPattern()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected an element of either Enum\(.*\), Regex\(.*\) or Seq\(Int\), got u?'junk'")
    def test_Either(self):
        p = Either(Int, Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected an element of either Int or Float, got u?'junk'")
    def test_Enum(self):
        p = Enum("red", "green")
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"invalid value: u?'junk'; allowed values are red or green")
    def test_FontSize(self):
        p = FontSize()
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"u?'junk' is not a valid font size value")
    def test_Instance(self):
        p = Instance(HasProps)
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected an instance of type HasProps, got junk of type (str|unicode)")
    def test_MinMaxBounds(self):
        p = MinMaxBounds()
        with pytest.raises(ValueError) as e:
            p.validate(10)
        assert matches(str(e.value), r"expected an element of either Auto, Tuple\(Float, Float\) or Tuple\(TimeDelta, TimeDelta\), got 10")
    def test_Regex(self):
        p = Regex("green")
        with pytest.raises(ValueError) as e:
            p.validate("junk")
        assert matches(str(e.value), r"expected a string matching u?'green' pattern, got u?'junk'")
    def test_String(self):
        p = String()
        with pytest.raises(ValueError) as e:
            p.validate(10)
        assert matches(str(e.value), r"expected a value of type (str|basestring), got 10 of type int")
    def test_MarkerType(self):
        p = MarkerType()
        with pytest.raises(ValueError) as e:
            p.validate("foo")
        assert matches(str(e.value), r"invalid value: u?'foo'; allowed values are asterisk, .* or x")


    @pytest.mark.parametrize('spec', SPECS)
    def test_Spec(self, spec):
        p = spec(default=None)
        with pytest.raises(ValueError) as e:
            p.validate(dict(bad="junk"))
        assert matches(str(e.value), r"expected an element of either String, .*, got {u?'bad': u?'junk'}")

@pytest.mark.parametrize('detail', [True, False])
class TestValidateDetailExplicit(object):

    # test_Any unecessary (no validation)

    # TODO (bev) test_Image

    def test_Angle(self, detail):
        p = Angle()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_Bool(self, detail):
        p = Bool()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_Complex(self, detail):
        p = Complex()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_Float(self, detail):
        p = Float()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_Int(self, detail):
        p = Int()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_Interval(self, detail):
        p = Interval(Float, 0.0, 1.0)
        with pytest.raises(ValueError) as e:
            p.validate(2, detail)
        assert (str(e.value) == "") == (not detail)
    def test_Percent(self, detail):
        p = Percent()
        with pytest.raises(ValueError) as e:
            p.validate(10, detail)
        assert (str(e.value) == "") == (not detail)
    def test_Size(self, detail):
        p = Size()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)


    def test_List(self, detail):
        p = List(Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_Seq(self, detail):
        p = Seq(Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_Dict(self, detail):
        p = Dict(String, Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_Tuple(self, detail):
        p = Tuple(Int, Int)
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)


    def test_Color(self, detail):
        p = Color()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_ColumnData(self, detail):
        p = ColumnData(String, Seq(Float))
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_Date(self, detail):
        p = Date()
        with pytest.raises(ValueError) as e:
            p.validate(p, detail)
        assert (str(e.value) == "") == (not detail)
    def test_DashPattern(self, detail):
        p = DashPattern()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_Either(self, detail):
        p = Either(Int, Float)
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_Enum(self, detail):
        p = Enum("red", "green")
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_FontSize(self, detail):
        p = FontSize()
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_Instance(self, detail):
        p = Instance(HasProps)
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_MinMaxBounds(self, detail):
        p = MinMaxBounds()
        with pytest.raises(ValueError) as e:
            p.validate(10, detail)
        assert (str(e.value) == "") == (not detail)
    def test_Regex(self, detail):
        p = Regex("green")
        with pytest.raises(ValueError) as e:
            p.validate("junk", detail)
        assert (str(e.value) == "") == (not detail)
    def test_String(self, detail):
        p = String()
        with pytest.raises(ValueError) as e:
            p.validate(10, detail)
        assert (str(e.value) == "") == (not detail)
    def test_MarkerType(self, detail):
        p = MarkerType()
        with pytest.raises(ValueError) as e:
            p.validate("foo", detail)
        assert (str(e.value) == "") == (not detail)


    @pytest.mark.parametrize('spec', SPECS)
    def test_Spec(self, detail, spec):
        p = spec(default=None)
        with pytest.raises(ValueError) as e:
            p.validate(dict(bad="junk"), detail)
        assert (str(e.value) == "") == (not detail)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def matches(string, pattern):
    return re.match(pattern, string) is not None

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpv, ALL)
