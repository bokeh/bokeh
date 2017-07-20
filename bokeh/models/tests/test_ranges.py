from __future__ import absolute_import

import pytest

from bokeh.models import Range1d, DataRange1d, FactorRange


# ------------------------
# Range1d test
# ------------------------

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
