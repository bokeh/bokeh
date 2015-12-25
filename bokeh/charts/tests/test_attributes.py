from __future__ import absolute_import

import pytest

from bokeh.charts.attributes import AttrSpec


@pytest.fixture
def simple_attr():
    return AttrSpec(items=['a', 'b', 'c'], iterable=['red', 'blue', 'green'])


@pytest.fixture
def more_items_attr():
    return AttrSpec(items=['a', 'b', 'c', 'd'], iterable=['red', 'blue'])


def test_attr_map_with_explicit_items(simple_attr):
    # we should have an attribute map if we have the things to map between
    assert len(simple_attr.attr_map.keys()) > 0


def test_order_assignment(simple_attr):
    for item, iter_val in zip(simple_attr.items, simple_attr.iterable):
        assert simple_attr[item] == iter_val


def test_attr_map_cycle(more_items_attr):
    # if more items exist than values in iterable, we should still work
    assert more_items_attr['c'] == 'red'
    assert more_items_attr['d'] == 'blue'
