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
import datetime as dt

import mock

# External imports

# Bokeh imports
from bokeh.core.validation import check_integrity

from .utils.property_utils import check_properties_existence

# Module under test
from bokeh.models import Range1d, DataRange1d, FactorRange

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Range1d(object):

    def test_basic(self):
        r = Range1d()
        check_properties_existence(r, [
            "callback",
            "start",
            "end",
            "reset_start",
            "reset_end",
            "bounds",
            "min_interval",
            "max_interval"],
        )

    def test_init_with_timedelta(self):
        range1d = Range1d(start=-dt.timedelta(seconds=5), end=dt.timedelta(seconds=3))
        assert range1d.start == -dt.timedelta(seconds=5)
        assert range1d.end == dt.timedelta(seconds=3)
        assert range1d.bounds is None

    def test_init_with_datetime(self):
        range1d = Range1d(start=dt.datetime(2016, 4, 28, 2, 20, 50), end=dt.datetime(2017, 4, 28, 2, 20, 50))
        assert range1d.start == dt.datetime(2016, 4, 28, 2, 20, 50)
        assert range1d.end == dt.datetime(2017, 4, 28, 2, 20, 50)
        assert range1d.bounds is None

    def test_init_with_float(self):
        range1d = Range1d(start=-1.0, end=3.0)
        assert range1d.start == -1.0
        assert range1d.end == 3.0
        assert range1d.bounds is None

    def test_init_with_int(self):
        range1d = Range1d(start=-1, end=3)
        assert range1d.start == -1
        assert range1d.end == 3
        assert range1d.bounds is None

    def test_init_with_positional_arguments(self):
        range1d = Range1d(1, 2)
        assert range1d.start == 1
        assert range1d.end == 2
        assert range1d.bounds is None

    def test_init_with_keyword_arguments(self):
        range1d = Range1d(start=1, end=2)
        assert range1d.start == 1
        assert range1d.end == 2
        assert range1d.bounds is None

    def test_cannot_initialize_with_both_keyword_and_positional_arguments(self):
        with pytest.raises(ValueError):
            Range1d(1, 2, start=1, end=2)


    def test_cannot_initialize_with_three_positional_arguments(self):
        with pytest.raises(ValueError):
            Range1d(1, 2, 3)


    def test_with_max_bound_smaller_than_min_bounded_raises_valueerror(self):
        with pytest.raises(ValueError):
            Range1d(1, 2, bounds=(1, 0))
        with pytest.raises(ValueError):
            Range1d(1, 2, bounds=[1, 0])


    def test_bounds_with_text_rejected_as_the_correct_value_error(self):
        with pytest.raises(ValueError) as e:
            Range1d(1, 2, bounds="21")  # The string is indexable, so this may not fail properly
        assert e.value.args[0].startswith('expected an element of either')


    def test_bounds_with_three_item_tuple_raises_valueerror(self):
        with pytest.raises(ValueError):
            Range1d(1, 2, bounds=(0, 1, 2))

class Test_DataRange1d(object):

    def test_basic(self):
        r = DataRange1d()
        check_properties_existence(r, [
            "callback",
            "names",
            "renderers",
            "range_padding",
            "range_padding_units",
            "flipped",
            "follow",
            "follow_interval",
            "default_span",
            "start",
            "end",
            "bounds",
            "min_interval",
            "max_interval"],
        )

    def test_init_with_no_arguments(self):
        datarange1d = DataRange1d()
        assert datarange1d.start is None
        assert datarange1d.end is None
        assert datarange1d.bounds is None

    def test_init_with_timedelta(self):
        datarange1d = DataRange1d(start=-dt.timedelta(seconds=5), end=dt.timedelta(seconds=3))
        assert datarange1d.start == -dt.timedelta(seconds=5)
        assert datarange1d.end == dt.timedelta(seconds=3)
        assert datarange1d.bounds is None

    def test_init_with_datetime(self):
        datarange1d = DataRange1d(start=dt.datetime(2016, 4, 28, 2, 20, 50), end=dt.datetime(2017, 4, 28, 2, 20, 50))
        assert datarange1d.start == dt.datetime(2016, 4, 28, 2, 20, 50)
        assert datarange1d.end == dt.datetime(2017, 4, 28, 2, 20, 50)
        assert datarange1d.bounds is None

    def test_init_with_float(self):
        datarange1d = DataRange1d(start=-1.0, end=3.0)
        assert datarange1d.start == -1.0
        assert datarange1d.end == 3.0
        assert datarange1d.bounds is None

    def test_init_with_int(self):
        datarange1d = DataRange1d(start=-1, end=3)
        assert datarange1d.start == -1
        assert datarange1d.end == 3
        assert datarange1d.bounds is None

    def test_init_with_follow_sets_bounds_to_none(self):
        datarange1d = DataRange1d(follow="start")
        assert datarange1d.follow == "start"
        assert datarange1d.bounds is None

    def test_init_with_bad_bounds(self):
        with pytest.raises(ValueError):
            DataRange1d(1, 2, bounds=(1, 0))
        with pytest.raises(ValueError):
            DataRange1d(1, 2, bounds=[1, 0])
        with pytest.raises(ValueError):
            Range1d(1, 2, bounds="21")


class Test_FactorRange(object):

    def test_basic(self):
        r = FactorRange()
        check_properties_existence(r, [
            "callback",
            "factors",
            "factor_padding",
            "group_padding",
            "subgroup_padding",
            "range_padding",
            "range_padding_units",
            "start",
            "end",
            "bounds",
            "min_interval",
            "max_interval"],
        )

    def test_init_defauls(self):
        factor_range = FactorRange("a", "b")
        assert factor_range.factors == ["a", "b"]
        assert factor_range.range_padding == 0
        assert factor_range.range_padding_units == "percent"
        assert factor_range.factor_padding == 0
        assert factor_range.group_padding == 1.4
        assert factor_range.subgroup_padding == 0.8
        assert factor_range.bounds == None
        assert factor_range.min_interval == None
        assert factor_range.max_interval == None

    def test_init_with_positional_arguments(self):
        factor_range = FactorRange("a", "b")
        assert factor_range.factors == ["a", "b"]

        factor_range = FactorRange(["a", "x"], ["b", "y"])
        assert factor_range.factors == [["a", "x"], ["b", "y"]]

        factor_range = FactorRange(["a", "x", "1'"], ["b", "y", "2"])
        assert factor_range.factors == [["a", "x", "1'"], ["b", "y", "2"]]

    def test_init_with_keyword_arguments(self):
        factor_range = FactorRange(factors=["a", "b", "c", "d", "e"])
        assert factor_range.factors == ["a", "b", "c", "d", "e"]

    def test_cannot_initialize_with_both_keyword_and_positional_arguments(self):
        with pytest.raises(ValueError):
            FactorRange(["a", "b", "c"], factors=["a", "b", "c"])

    def test_duplicate_factors_raises_validation_error(self):
        r = FactorRange("foo", "bar", "foo")
        with mock.patch('bokeh.core.validation.check.log') as mock_logger:
            check_integrity([r])
        assert mock_logger.error.call_count == 1

        r = FactorRange(factors=[("foo", "a"), ("foo", "b"),  ("foo", "a")])
        with mock.patch('bokeh.core.validation.check.log') as mock_logger:
            check_integrity([r])
        assert mock_logger.error.call_count == 1

        r = FactorRange(factors=[("foo", "a", "1"), ("foo", "a", "2"),  ("foo", "a", "1")])
        with mock.patch('bokeh.core.validation.check.log') as mock_logger:
            check_integrity([r])
        assert mock_logger.error.call_count == 1

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
