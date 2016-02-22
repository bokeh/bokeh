""" This is the Bokeh charts testing interface.

"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from __future__ import absolute_import

import pytest

from bokeh.charts.attributes import ColorAttr, DashAttr, MarkerAttr
from bokeh.charts.data_source import ChartDataSource, NumericalColumnsAssigner

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def test_list(test_data):
    """Test creating chart data source from array-like list data."""
    ds = ChartDataSource.from_data(*test_data.list_data)
    assert len(ds.columns) == 2
    assert len(ds.index) == 4


def test_array(test_data):
    """Test creating chart data source from array-like numpy data."""
    ds = ChartDataSource.from_data(*test_data.array_data)
    assert len(ds.columns) == 2
    assert len(ds.index) == 4


def test_pandas(test_data):
    """Test creating chart data source from existing dataframe."""
    pd_data = test_data.pd_data.copy()
    ds = ChartDataSource.from_data(pd_data)
    assert len(ds.columns) == 2
    assert len(ds.index) == 4

    ds = ChartDataSource(pd_data)
    assert len(ds.columns) == 2
    assert len(ds.index) == 4

    # Test for issue #3899
    # ChartDataSource shouldn't modify the input DataFrame
    assert pd_data.equals(test_data.pd_data)


def test_dict(test_data):
    """Test creating chart data source from dict of arrays."""
    ds = ChartDataSource.from_data(test_data.dict_data)
    assert len(ds.columns) == 2
    assert len(ds.index) == 4


def test_records(test_data):
    """Test creating chart data source from array of dicts."""
    ds = ChartDataSource.from_data(test_data.records_data)
    assert len(ds.columns) == 2
    assert len(ds.index) == 4


def test_groupby(test_data):
    # Note: this works because MarkerAttr and DashAttr are permissive in
    # what is accepted for iterable, i.e. List(String)
    for cls in (ColorAttr, MarkerAttr, DashAttr):
        single_col_spec = {'test': cls(df=test_data.auto_data, columns='cyl',
                                            attrname='test', iterable=['red', 'blue'])}
        multi_col_spec = {'test': cls(df=test_data.auto_data,
                                           columns=('cyl', 'origin'),
                                           attrname='test', iterable=['red', 'blue'])}

        ds = ChartDataSource(df=test_data.auto_data)
        groups = list(ds.groupby(**single_col_spec))
        assert len(groups) == 5

        ds = ChartDataSource(df=test_data.auto_data)
        groups = list(ds.groupby(**multi_col_spec))
        assert len(groups) == 9


def test_derived_selections(test_data):
    ds = ChartDataSource.from_data(*test_data.array_data)
    try:
        [[ds[dim] for dim in req_dims] for req_dims in ds._required_dims]
    except KeyError:
        pytest.fail('Required dimension not correctly set by ChartDataSource.')


def test_derived_cols_from_lists_kw(test_data):
    """List of lists for dimension results in column derivation."""
    ds = ChartDataSource.from_data(y=test_data.array_data)
    assert ds['y'] == ['a', 'b']


def test_derived_cols_from_lists(test_data):
    """List of lists for dimension results in column derivation."""
    ds = ChartDataSource.from_data(test_data.array_data, dims=('y', 'x'))
    assert ds['y'] == ['a', 'b']


def test_custom_derived_cols_from_df(test_data):
    """Wide dataframe columns assigned to y dimension for the chart.

    This tests using the NumericalColumnsAssigner, which is used for charts
    that prefer behavior of expecting series-like data. Typically the x axis
    is used as an index, then the y axis will be assigned multiple columns.
    """
    ds = ChartDataSource.from_data(test_data.pd_data, dims=('x', 'y'),
                                   column_assigner=NumericalColumnsAssigner)
    assert ds['y'] == ['col1', 'col2']


# ToDo: add tests for blaze support
# def test_blaze_data_no_fields(test_data):
#     #import blaze
#     pass
