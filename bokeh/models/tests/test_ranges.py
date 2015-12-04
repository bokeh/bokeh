from __future__ import absolute_import

import pytest

from bokeh.models import Range1d, FactorRange


# ------------------------
# Range1d test
# ------------------------

def test_range1d_init_with_positional_arguments():
    range1d = Range1d(1, 2)
    assert range1d.start == 1
    assert range1d.end == 2


def test_range1d_init_with_keyword_arguments():
    range1d = Range1d(start=1, end=2)
    assert range1d.start == 1
    assert range1d.end == 2


def test_range1d_cannot_initialize_with_both_keyword_and_positional_arguments():
    with pytest.raises(ValueError):
        Range1d(1, 2, start=1, end=2)


def test_range1d_cannot_initialize_with_three_positional_arguments():
    with pytest.raises(ValueError):
        Range1d(1, 2, 3)


# ------------------------
# Factor range test
# ------------------------

def test_factorrange_init_with_positional_arguments():
    factor_range = FactorRange(1, 2)
    assert factor_range.factors == [1, 2]


def test_factorrange_init_with_keyword_arguments():
    factor_range = FactorRange(factors=[1, 2, 3, 4, 5])
    assert factor_range.factors == [1, 2, 3, 4, 5]


def test_factorrange_cannot_initialize_with_both_keyword_and_positional_arguments():
    with pytest.raises(ValueError):
        Range1d([1, 2, 3], factors=[1, 2, 3])


def test_factorrange_cannot_initialize_with_list_as_positional_argument():
    with pytest.raises(ValueError):
        FactorRange([1, 2, 3, 4])
