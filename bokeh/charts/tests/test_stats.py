import pytest

from bokeh.charts.stats import Bins
from bokeh.models import ColumnDataSource


@pytest.fixture
def ds(test_data):
    return ColumnDataSource(test_data.auto_data)


def test_explicit_bin_count(ds):
    b = Bins(source=ds, column='mpg', bin_count=2)
    assert len(b.bins) == 2


def test_auto_bin_count(ds):
    b = Bins(source=ds, column='mpg')
    assert len(b.bins) == 12


def test_ndbin_simple(ds):
    b = Bins(source=ds, column='cyl', dimensions=['mpg', 'displ'])
    assert len(b.bins) > 0