import pytest

from bokeh.charts.stats import Bins, Histogram
from bokeh.models import ColumnDataSource

import pandas as pd


@pytest.fixture
def ds(test_data):
    return ColumnDataSource(test_data.auto_data)


def test_explicit_bin_count(ds):
    b = Bins(source=ds, column='mpg', bins=2)
    assert len(b.bins) == 2


def test_auto_bin_count(ds):
    b = Bins(source=ds, column='mpg')
    assert len(b.bins) == 12

    # this should test it still matches
    # http://stats.stackexchange.com/questions/114490/optimal-bin-width-for-two-dimensional-histogram
    # with iterables with the same value
    b = Bins(values=[5,5,5,5,5], bins=None)
    assert len(b.bins) == 3


def test_bin_labeling(ds):
    Bins(source=ds, column='cyl', bins=2)
    assert len(pd.Series(ds.data['cyl_bin']).drop_duplicates()) == 2


def test_histogram_wo_density():
    values = list(range(10))
    h = Histogram(values=values, bins=3)

    assert len(h.bins) == 3
    assert [b.label[0] for b in h.bins] == ['[0.000000, 3.000000]', '(3.000000, 6.000000]', '(6.000000, 9.000000]']
    assert [b.values[0] for b in h.bins] == [3, 3, 4]


def test_histogram_w_density():
    values = list(range(10))
    h = Histogram(values=values, bins=3, density=True)

    assert len(h.bins) == 3
    assert [b.label[0] for b in h.bins] == ['[0.000000, 3.000000]', '(3.000000, 6.000000]', '(6.000000, 9.000000]']
    assert [b.values[0] for b in h.bins] == [0.1, 0.1, 0.13333333333333333]


def test_histogram_ill_defined_data():
    # See e.g. #3660
    for x in (-21, -0.001, 0, 0.001, 21):
        values  = [x, x]
        h = Histogram(values=values)

        assert len(h.bins) <= 3
        assert len(h.bins) >= 1
        assert sum([b.value for b in h.bins]) == 2
