from __future__ import absolute_import

import pytest

from bokeh.charts.attributes import AttrSpec


PALETTE = ['red', 'blue', 'green', 'black', 'brown', 'yellow', 'purple']


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
    # values in iterable should be applied in order to items
    for item, iter_val in zip(simple_attr.items, simple_attr.iterable):
        assert simple_attr[item] == iter_val


def test_attr_map_cycle(more_items_attr):
    # if more items exist than values in iterable, we should still work
    assert more_items_attr['c'] == 'red'
    assert more_items_attr['d'] == 'blue'


def test_attr_default_sort(test_data):
    # default option is to sort, so 3 cylinders should be first item to get assignment
    attr = AttrSpec(df=test_data.auto_data, columns='cyl', iterable=PALETTE)
    assert attr[3] == 'red'


def test_attr_no_sort(test_data):
    # should not sort when told not to
    attr_no_sort = AttrSpec(df=test_data.auto_data, columns='cyl', iterable=PALETTE, sort=False)
    attr_sort = AttrSpec(df=test_data.auto_data, columns='cyl', iterable=PALETTE)

    assert attr_sort.items[0] != attr_no_sort.items[0]


def test_attr_categorical_sort(test_data):
    # make sure we handle categorical data appropriately
    attr = AttrSpec(df=test_data.auto_data, columns='reversed_cyl', iterable=PALETTE)
    assert attr[8] == 'red'
