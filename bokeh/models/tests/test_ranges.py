from __future__ import absolute_import

import pytest

from bokeh.models import Range1d, DataRange1d, FactorRange

from .utils.property_utils import check_properties_existence


# ------------------------
# Range1d test
# ------------------------

def test_Range1d():
    r = Range1d()
    check_properties_existence(r, [
        "callback",
        "start",
        "end",
        "bounds",
        "min_interval",
        "max_interval"],
    )


def test_range1d_init_with_positional_arguments():
    range1d = Range1d(1, 2)
    assert range1d.start == 1
    assert range1d.end == 2
    assert range1d.bounds is None


def test_range1d_init_with_keyword_arguments():
    range1d = Range1d(start=1, end=2)
    assert range1d.start == 1
    assert range1d.end == 2
    assert range1d.bounds is None


def test_range1d_cannot_initialize_with_both_keyword_and_positional_arguments():
    with pytest.raises(ValueError):
        Range1d(1, 2, start=1, end=2)


def test_range1d_cannot_initialize_with_three_positional_arguments():
    with pytest.raises(ValueError):
        Range1d(1, 2, 3)


def test_range1d_with_max_bound_smaller_than_min_bounded_raises_valueerror():
    with pytest.raises(ValueError):
        Range1d(1, 2, bounds=(1, 0))
    with pytest.raises(ValueError):
        Range1d(1, 2, bounds=[1, 0])


def test_range1d_bounds_with_text_rejected_as_the_correct_value_error():
    with pytest.raises(ValueError) as e:
        Range1d(1, 2, bounds="21")  # The string is indexable, so this may not fail properly
    assert e.value.args[0].startswith('expected an element of either')


def test_range1d_bounds_with_three_item_tuple_raises_valueerror():
    with pytest.raises(ValueError):
        Range1d(1, 2, bounds=(0, 1, 2))


# ------------------------
# DataRange1d test
# ------------------------

def test_DataRange1d():
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

def test_datarange1d_init_with_no_arguments():
    datarange1d = DataRange1d()
    assert datarange1d.start is None
    assert datarange1d.end is None
    assert datarange1d.bounds is None


def test_datarange1d_init_with_follow_sets_bounds_to_none():
    datarange1d = DataRange1d(follow="start")
    assert datarange1d.follow == "start"
    assert datarange1d.bounds is None


def test_datarange1d_init_with_bad_bounds():
    with pytest.raises(ValueError):
        DataRange1d(1, 2, bounds=(1, 0))
    with pytest.raises(ValueError):
        DataRange1d(1, 2, bounds=[1, 0])
    with pytest.raises(ValueError):
        Range1d(1, 2, bounds="21")


# ------------------------
# Factor range test
# ------------------------

def test_FactorRange():
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

def test_factorrange_init_defauls():
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

def test_factorrange_init_with_positional_arguments():
    factor_range = FactorRange("a", "b")
    assert factor_range.factors == ["a", "b"]

    factor_range = FactorRange(["a", "x"], ["b", "y"])
    assert factor_range.factors == [["a", "x"], ["b", "y"]]

    factor_range = FactorRange(["a", "x", "1'"], ["b", "y", "2"])
    assert factor_range.factors == [["a", "x", "1'"], ["b", "y", "2"]]


def test_factorrange_init_with_keyword_arguments():
    factor_range = FactorRange(factors=["a", "b", "c", "d", "e"])
    assert factor_range.factors == ["a", "b", "c", "d", "e"]


def test_factorrange_cannot_initialize_with_both_keyword_and_positional_arguments():
    with pytest.raises(ValueError):
        Range1d(["a", "b", "c"], factors=["a", "b", "c"])
