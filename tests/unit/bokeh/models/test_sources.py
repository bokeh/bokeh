#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import datetime as dt
import io
import warnings

# External imports
import numpy as np

# Bokeh imports
from bokeh.models import Selection
from bokeh.util.serialization import convert_datetime_array, transform_column_source_data

# Module under test
import bokeh.models.sources as bms # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class TestColumnDataSource:
    def test_basic(self) -> None:
        ds = bms.ColumnDataSource()
        assert isinstance(ds, bms.DataSource)
        assert isinstance(ds.selected, Selection)

    def test_selected_is_readonly(self) -> None:
        ds = bms.ColumnDataSource()
        with pytest.raises(RuntimeError) as e:
            ds.selected = Selection()
            assert str(e).endswith("ColumnDataSource.selected is a readonly property")

    def test_selected_serialized(self) -> None:
        ds = bms.ColumnDataSource()
        prop = ds.lookup('selected')
        assert prop.serialized == True

    def test_init_dict_arg(self) -> None:
        data = dict(a=[1], b=[2])
        ds = bms.ColumnDataSource(data)
        assert ds.data == data
        assert set(ds.column_names) == set(data.keys())

    def test_init_dict_data_kwarg(self) -> None:
        data = dict(a=[1], b=[2])
        ds = bms.ColumnDataSource(data=data)
        assert ds.data == data
        assert set(ds.column_names) == set(data.keys())

    def test_init_dataframe_arg(self, pd) -> None:
        data = dict(a=[1, 2], b=[2, 3])
        df = pd.DataFrame(data)
        ds = bms.ColumnDataSource(df)
        assert set(df.columns).issubset(set(ds.column_names))
        for key in data.keys():
            assert isinstance(ds.data[key], np.ndarray)
            assert list(df[key]) == list(ds.data[key])
        assert isinstance(ds.data['index'], np.ndarray)
        assert [0, 1] == list(ds.data['index'])
        assert set(ds.column_names) - set(df.columns) == {"index"}

    def test_data_accepts_dataframe_arg(self, pd) -> None:
        data = dict(a=[1, 2], b=[2, 3])
        df = pd.DataFrame(data)
        ds = bms.ColumnDataSource()
        assert ds.data == {}
        ds.data = df
        assert set(df.columns).issubset(set(ds.column_names))
        for key in data.keys():
            assert isinstance(ds.data[key], np.ndarray)
            assert list(df[key]) == list(ds.data[key])
        assert isinstance(ds.data['index'], np.ndarray)
        assert [0, 1] == list(ds.data['index'])
        assert set(ds.column_names) - set(df.columns) == {"index"}

    def test_init_dataframe_data_kwarg(self, pd) -> None:
        data = dict(a=[1, 2], b=[2, 3])
        df = pd.DataFrame(data)
        ds = bms.ColumnDataSource(data=df)
        assert set(df.columns).issubset(set(ds.column_names))
        for key in data.keys():
            assert isinstance(ds.data[key], np.ndarray)
            assert list(df[key]) == list(ds.data[key])
        assert isinstance(ds.data['index'], np.ndarray)
        assert [0, 1] == list(ds.data['index'])
        assert set(ds.column_names) - set(df.columns) == {"index"}

    def test_init_dataframe_index_named_column(self, pd) -> None:
        data = dict(a=[1, 2], b=[2, 3], index=[4, 5])
        df = pd.DataFrame(data)
        ds = bms.ColumnDataSource(data=df)
        assert set(df.columns).issubset(set(ds.column_names))
        for key in data.keys():
            assert isinstance(ds.data[key], np.ndarray)
            assert list(df[key]) == list(ds.data[key])
        assert isinstance(ds.data['level_0'], np.ndarray)
        assert [0, 1] == list(ds.data['level_0'])
        assert set(ds.column_names) - set(df.columns) == {"level_0"}

    def test_data_accepts_dataframe_index_named_column(self, pd) -> None:
        data = dict(a=[1, 2], b=[2, 3], index=[4, 5])
        df = pd.DataFrame(data)
        ds = bms.ColumnDataSource()
        assert ds.data == {}
        ds.data = df
        assert set(df.columns).issubset(set(ds.column_names))
        for key in data.keys():
            assert isinstance(ds.data[key], np.ndarray)
            assert list(df[key]) == list(ds.data[key])
        assert isinstance(ds.data['level_0'], np.ndarray)
        assert [0, 1] == list(ds.data['level_0'])
        assert set(ds.column_names) - set(df.columns) == {"level_0"}

    def test_init_dataframe_column_categoricalindex(self, pd) -> None:
        columns = pd.CategoricalIndex(['a', 'b'])
        data = [[0,2], [1,3]]
        df = pd.DataFrame(columns=columns, data=data)
        ds = bms.ColumnDataSource(data=df)
        assert set(df.columns).issubset(set(ds.column_names))
        for key in columns:
            assert isinstance(ds.data[key], np.ndarray)
            assert list(df[key]) == list(ds.data[key])
        assert isinstance(ds.data['index'], np.ndarray)
        assert [0, 1] == list(ds.data['index'])
        assert set(ds.column_names) - set(df.columns) == {"index"}

    def test_data_accepts_dataframe_column_categoricalindex(self, pd) -> None:
        columns = pd.CategoricalIndex(['a', 'b'])
        data = [[0,2], [1,3]]
        df = pd.DataFrame(columns=columns, data=data)
        ds = bms.ColumnDataSource()
        assert ds.data == {}
        ds.data = df
        assert set(df.columns).issubset(set(ds.column_names))
        for key in columns:
            assert isinstance(ds.data[key], np.ndarray)
            assert list(df[key]) == list(ds.data[key])
        assert isinstance(ds.data['index'], np.ndarray)
        assert [0, 1] == list(ds.data['index'])
        assert set(ds.column_names) - set(df.columns) == {"index"}

    def test_init_dataframe_nonstring_named_column(self, pd) -> None:
        data = {1: [1, 2], 2: [2, 3]}
        df = pd.DataFrame(data)
        with pytest.raises(ValueError, match=r'expected an element of.*'):
            bms.ColumnDataSource(data=df)

    def test_init_dataframe_nonstring_named_multicolumn(self, pd) -> None:
        data = {(1, 2): [1, 2], (2, 3): [2, 3]}
        df = pd.DataFrame(data)
        with pytest.raises(TypeError, match=r'Could not flatten.*'):
            bms.ColumnDataSource(data=df)

    def test_init_groupby_arg(self, pd) -> None:
        from bokeh.sampledata.autompg import autompg as df
        group = df.groupby(by=['origin', 'cyl'])
        ds = bms.ColumnDataSource(group)
        s = group.describe()
        assert len(ds.column_names) == 49
        assert isinstance(ds.data['origin_cyl'], np.ndarray)
        for key in s.columns.values:
            k2 = "_".join(key)
            assert isinstance(ds.data[k2], np.ndarray)
            assert list(s[key]) == list(ds.data[k2])

    def test_data_accepts_groupby_arg(self, pd) -> None:
        from bokeh.sampledata.autompg import autompg as df
        group = df.groupby(by=['origin', 'cyl'])
        ds = bms.ColumnDataSource()
        assert ds.data == {}
        ds.data = group
        s = group.describe()
        assert len(ds.column_names) == 49
        assert isinstance(ds.data['origin_cyl'], np.ndarray)
        for key in s.columns.values:
            k2 = "_".join(key)
            assert isinstance(ds.data[k2], np.ndarray)
            assert list(s[key]) == list(ds.data[k2])

    def test_init_groupby_data_kwarg(self, pd) -> None:
        from bokeh.sampledata.autompg import autompg as df
        group = df.groupby(by=['origin', 'cyl'])
        ds = bms.ColumnDataSource(data=group)
        s = group.describe()
        assert len(ds.column_names) == 49
        assert isinstance(ds.data['origin_cyl'], np.ndarray)
        for key in s.columns.values:
            k2 = "_".join(key)
            assert isinstance(ds.data[k2], np.ndarray)
            assert list(s[key]) == list(ds.data[k2])

    def test_init_groupby_with_None_subindex_name(self, pd) -> None:
        df = pd.DataFrame({"A": [1, 2, 3, 4] * 2, "B": [10, 20, 30, 40] * 2, "C": range(8)})
        group = df.groupby(['A', [10, 20, 30, 40] * 2])
        ds = bms.ColumnDataSource(data=group)
        s = group.describe()
        assert len(ds.column_names) == 17
        assert isinstance(ds.data['index'], np.ndarray)
        for key in s.columns.values:
            k2 = "_".join(key)
            assert isinstance(ds.data[k2], np.ndarray)
            assert list(s[key]) == list(ds.data[k2])

    def test_data_accepts_groupby_with_None_subindex_name(self, pd) -> None:
        df = pd.DataFrame({"A": [1, 2, 3, 4] * 2, "B": [10, 20, 30, 40] * 2, "C": range(8)})
        group = df.groupby(['A', [10, 20, 30, 40] * 2])
        ds = bms.ColumnDataSource()
        assert ds.data == {}
        ds.data = group
        s = group.describe()
        assert len(ds.column_names) == 17
        assert isinstance(ds.data['index'], np.ndarray)
        for key in s.columns.values:
            k2 = "_".join(key)
            assert isinstance(ds.data[k2], np.ndarray)
            assert list(s[key]) == list(ds.data[k2])

    def test_init_propertyvaluecolumndata_copy(self) -> None:
        data = dict(a=[1], b=[2])
        cd = bms.ColumnDataSource(data).data
        ds = bms.ColumnDataSource(data=cd)
        assert ds.data == cd
        assert id(ds.data) != id(cd)
        ds.data['a'][0] = 2
        assert cd['a'][0] == 2

    def test_add_with_name(self) -> None:
        ds = bms.ColumnDataSource()
        name = ds.add([1,2,3], name="foo")
        assert name == "foo"
        name = ds.add([4,5,6], name="bar")
        assert name == "bar"

    def test_add_without_name(self) -> None:
        ds = bms.ColumnDataSource()
        name = ds.add([1,2,3])
        assert name == "Series 0"
        name = ds.add([4,5,6])
        assert name == "Series 1"

    def test_add_with_and_without_name(self) -> None:
        ds = bms.ColumnDataSource()
        name = ds.add([1,2,3], "foo")
        assert name == "foo"
        name = ds.add([4,5,6])
        assert name == "Series 1"

    def test_remove_exists(self) -> None:
        ds = bms.ColumnDataSource()
        name = ds.add([1,2,3], "foo")
        assert name
        ds.remove("foo")
        assert ds.column_names == []

    def test_remove_exists2(self) -> None:
        with warnings.catch_warnings(record=True) as w:
            ds = bms.ColumnDataSource()
            ds.remove("foo")
            assert ds.column_names == []
            assert len(w) == 1
            assert w[0].category == UserWarning
            assert str(w[0].message) == "Unable to find column 'foo' in data source"

    def test_stream_bad_data(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10], b=[20]))
        with pytest.raises(ValueError, match=r"Must stream updates to all existing columns \(missing: a, b\)"):
            ds.stream(dict())
        with pytest.raises(ValueError, match=r"Must stream updates to all existing columns \(missing: b\)"):
            ds.stream(dict(a=[10]))
        with pytest.raises(ValueError, match=r"Must stream updates to all existing columns \(extra: x\)"):
            ds.stream(dict(a=[10], b=[10], x=[10]))
        with pytest.raises(ValueError, match=r"Must stream updates to all existing columns \(missing: b, extra: x\)"):
            ds.stream(dict(a=[10], x=[10]))
        with pytest.raises(ValueError, match=r"All streaming column updates must be the same length"):
            ds.stream(dict(a=[10], b=[10, 20]))

        with pytest.raises(ValueError, match=r"stream\(...\) only supports 1d sequences, got ndarray with size \(.*"):
            ds.stream(dict(a=[10], b=np.ones((1,1))))

    def test__df_index_name_with_named_index(self, pd) -> None:
        df = pd.DataFrame(dict(a=[10], b=[20], c=[30])).set_index('c')
        assert bms.ColumnDataSource._df_index_name(df) == "c"

    def test__df_index_name_with_unnamed_index(self, pd) -> None:
        df = pd.DataFrame(dict(a=[10], b=[20], c=[30]))
        assert bms.ColumnDataSource._df_index_name(df) == "index"

    def test__df_index_name_with_named_multi_index(self, pd) -> None:
        data = io.StringIO("""\
Fruit,Color,Count,Price
Apple,Red,3,$1.29
Apple,Green,9,$0.99
Pear,Red,25,$2.59
Pear,Green,26,$2.79
Lime,Green,99,$0.39
""")
        df = pd.read_csv(data).set_index(['Fruit', 'Color'])
        assert df.index.names == ['Fruit', 'Color']
        assert bms.ColumnDataSource._df_index_name(df) == "Fruit_Color"

    def test__df_index_name_with_unnamed_multi_index(self, pd) -> None:
        arrays = [np.array(['bar', 'bar', 'baz', 'baz', 'foo', 'foo', 'qux', 'qux']),
                  np.array(['one', 'two', 'one', 'two', 'one', 'two', 'one', 'two'])]
        df = pd.DataFrame(np.random.randn(8, 4), index=arrays)
        assert df.index.names == [None, None]
        assert bms.ColumnDataSource._df_index_name(df) == "index"

    def test__stream_good_data(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10], b=[20]))
        ds._document = "doc"
        stuff = {}
        mock_setter = object()

        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._stream = mock
        # internal implementation of stream
        ds._stream(dict(a=[11, 12], b=[21, 22]), "foo", mock_setter)
        assert stuff['args'] == ("doc", ds, dict(a=[11, 12], b=[21, 22]), "foo", mock_setter)
        assert stuff['kw'] == {}

    def test_stream_good_data(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10], b=[20]))
        ds._document = "doc"
        stuff = {}

        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._stream = mock
        # public implementation of stream
        ds._stream(dict(a=[11, 12], b=[21, 22]), "foo")
        assert stuff['args'] == ("doc", ds, dict(a=[11, 12], b=[21, 22]), "foo", None)
        assert stuff['kw'] == {}

    def test__stream_good_datetime64_data(self) -> None:
        now = dt.datetime.now()
        dates = np.array([now+dt.timedelta(i) for i in range(1, 10)], dtype='datetime64')
        ds = bms.ColumnDataSource(data=dict(index=dates, b=list(range(1, 10))))
        ds._document = "doc"
        stuff = {}
        mock_setter = object()

        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._stream = mock
        # internal implementation of stream
        new_date = np.array([now+dt.timedelta(10)], dtype='datetime64')
        ds._stream(dict(index=new_date, b=[10]), "foo", mock_setter)
        assert np.array_equal(stuff['args'][2]['index'], new_date)

    def test__stream_good_datetime64_data_transformed(self) -> None:
        now = dt.datetime.now()
        dates = np.array([now+dt.timedelta(i) for i in range(1, 10)], dtype='datetime64')
        dates = convert_datetime_array(dates)
        ds = bms.ColumnDataSource(data=dict(index=dates, b=list(range(1, 10))))
        ds._document = "doc"
        stuff = {}
        mock_setter = object()

        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._stream = mock
        # internal implementation of stream
        new_date = np.array([now+dt.timedelta(10)], dtype='datetime64')
        ds._stream(dict(index=new_date, b=[10]), "foo", mock_setter)
        transformed_date = convert_datetime_array(new_date)
        assert np.array_equal(stuff['args'][2]['index'], transformed_date)

    def test__stream_good_df_with_date_index_data(self, pd) -> None:
        df = pd.DataFrame(
            index=pd.date_range('now', periods=30, freq='T'),
            columns=['A'],
            data=np.cumsum(np.random.standard_normal(30), axis=0)
        )
        ds = bms.ColumnDataSource(data=df)
        ds._document = "doc"
        stuff = {}
        mock_setter = object()

        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._stream = mock
        new_df = pd.DataFrame(
            index=df.index + pd.to_timedelta('30m'),
            columns=df.columns,
            data=np.random.standard_normal(30)
        )
        ds._stream(new_df, "foo", mock_setter)
        assert np.array_equal(stuff['args'][2]['index'], new_df.index.values)
        assert np.array_equal(stuff['args'][2]['A'], new_df.A.values)

    def test__stream_good_dict_of_index_and_series_data(self, pd) -> None:
        df = pd.DataFrame(
            index=pd.date_range('now', periods=30, freq='T'),
            columns=['A'],
            data=np.cumsum(np.random.standard_normal(30), axis=0)
        )
        ds = bms.ColumnDataSource(data=df)
        ds._document = "doc"
        stuff = {}
        mock_setter = object()

        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._stream = mock
        new_df = pd.DataFrame(
            index=df.index + pd.to_timedelta('30m'),
            columns=df.columns,
            data=np.random.standard_normal(30)
        )
        ds._stream({'index': new_df.index, 'A': new_df.A}, "foo", mock_setter)
        assert np.array_equal(stuff['args'][2]['index'], new_df.index.values)
        assert np.array_equal(stuff['args'][2]['A'], new_df.A.values)

    def test__stream_good_dict_of_index_and_series_data_transformed(self, pd) -> None:
        df = pd.DataFrame(
            index=pd.date_range('now', periods=30, freq='T'),
            columns=['A'],
            data=np.cumsum(np.random.standard_normal(30), axis=0)
        )
        ds = bms.ColumnDataSource(data={'index': convert_datetime_array(df.index.values),
                                    'A': df.A})
        ds._document = "doc"
        stuff = {}
        mock_setter = object()

        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._stream = mock
        new_df = pd.DataFrame(
            index=df.index + pd.to_timedelta('30m'),
            columns=df.columns,
            data=np.random.standard_normal(30)
        )
        ds._stream({'index': new_df.index, 'A': new_df.A}, "foo", mock_setter)
        assert np.array_equal(stuff['args'][2]['index'], convert_datetime_array(new_df.index.values))
        assert np.array_equal(stuff['args'][2]['A'], new_df.A.values)

    def _assert_equal_dicts_of_arrays(self, d1, d2):
        assert d1.keys() == d2.keys()
        for k, v in d1.items():
            assert type(v) == np.ndarray
            assert np.array_equal(v, d2[k])

    def test_stream_dict_to_ds_created_from_df(self, pd) -> None:
        data = pd.DataFrame(dict(a=[10], b=[20], c=[30])).set_index('c')
        ds = bms.ColumnDataSource(data)
        ds._document = "doc"

        notify_owners_stuff = {}

        def notify_owners_mock(*args, **kw):
            notify_owners_stuff['args'] = args
            notify_owners_stuff['kw'] = kw
        ds.data._notify_owners = notify_owners_mock

        stream_stuff = {}
        data_stream = ds.data._stream

        def stream_wrapper(*args, **kwargs):
            stream_stuff['args'] = args
            stream_stuff['kwargs'] = kwargs
            data_stream(*args, **kwargs)
        ds.data._stream = stream_wrapper

        ds._stream(dict(a=[11, 12],
                        b=np.array([21, 22]),
                        c=pd.Series([31, 32])), 7)

        assert len(stream_stuff['args']) == 5
        expected_stream_args = ("doc", ds, dict(a=[11, 12],
                                                b=np.array([21, 22]),
                                                c=pd.Series([31, 32])), 7, None)
        for i, (arg, ex_arg) in enumerate(zip(stream_stuff['args'],
                                              expected_stream_args)):
            if i == 2:
                assert arg['a'] == ex_arg['a']
                del arg['a'], ex_arg['a']
                self._assert_equal_dicts_of_arrays(arg, ex_arg)
            else:
                assert arg == ex_arg

        assert stream_stuff['kwargs'] == {}

        assert len(notify_owners_stuff['args']) == 1
        self._assert_equal_dicts_of_arrays(notify_owners_stuff['args'][0],
                                           dict(a=np.array([10]),
                                                b=np.array([20]),
                                                c=np.array([30])))

        self._assert_equal_dicts_of_arrays(dict(ds.data),
                                           dict(a=np.array([10, 11, 12]),
                                                b=np.array([20, 21, 22]),
                                                c=np.array([30, 31, 32])))

    def test_stream_series_to_ds_created_from_df(self, pd) -> None:
        data = pd.DataFrame(dict(a=[10], b=[20], c=[30]))
        ds = bms.ColumnDataSource(data)
        ds._document = "doc"

        notify_owners_stuff = {}

        def notify_owners_mock(*args, **kw):
            notify_owners_stuff['args'] = args
            notify_owners_stuff['kw'] = kw

        ds.data._notify_owners = notify_owners_mock

        stream_stuff = {}
        data_stream = ds.data._stream

        def stream_wrapper(*args, **kwargs):
            stream_stuff['args'] = args
            stream_stuff['kwargs'] = kwargs
            data_stream(*args, **kwargs)

        ds.data._stream = stream_wrapper

        ds._stream(pd.Series([11, 21, 31], index=list('abc')), 7)

        assert len(stream_stuff['args']) == 5
        expected_df = pd.DataFrame(dict(a=np.array([11]),
                                                b=np.array([21]),
                                                c=np.array([31])))
        expected_stream_data = expected_df.to_dict('series')
        expected_stream_data['index'] = expected_df.index.values
        expected_args = ("doc", ds, expected_stream_data, 7, None)
        for i, (arg, ex_arg) in enumerate(zip(stream_stuff['args'], expected_args)):
            if i == 2:
                self._assert_equal_dicts_of_arrays(arg, ex_arg)
            else:
                assert arg == ex_arg

        assert stream_stuff['kwargs'] == {}

        assert len(notify_owners_stuff['args']) == 1
        self._assert_equal_dicts_of_arrays(notify_owners_stuff['args'][0],
                                           dict(a=np.array([10]),
                                                b=np.array([20]),
                                                c=np.array([30]),
                                                index=np.array([0])))

        self._assert_equal_dicts_of_arrays(dict(ds.data),
                                           dict(a=np.array([10, 11]),
                                                b=np.array([20, 21]),
                                                c=np.array([30, 31]),
                                                index=np.array([0, 0])))

    def test_stream_df_to_ds_created_from_df_named_index(self, pd) -> None:
        data = pd.DataFrame(dict(a=[10], b=[20], c=[30])).set_index('c')
        ds = bms.ColumnDataSource(data)
        ds._document = "doc"

        notify_owners_stuff = {}

        def notify_owners_mock(*args, **kw):
            notify_owners_stuff['args'] = args
            notify_owners_stuff['kw'] = kw

        ds.data._notify_owners = notify_owners_mock

        stream_stuff = {}
        data_stream = ds.data._stream

        def stream_wrapper(*args, **kwargs):
            stream_stuff['args'] = args
            stream_stuff['kwargs'] = kwargs
            data_stream(*args, **kwargs)

        ds.data._stream = stream_wrapper

        ds._stream(pd.DataFrame(dict(a=[11, 12],
                                     b=[21, 22],
                                     c=[31, 32])).set_index('c'), 7)

        assert len(stream_stuff['args']) == 5
        expected_steam_data = dict(a=np.array([11, 12]),
                                   b=np.array([21, 22]),
                                   c=np.array([31, 32]))
        expected_args = ("doc", ds, expected_steam_data, 7, None)
        for i, (arg, ex_arg) in enumerate(zip(stream_stuff['args'], expected_args)):
            if i == 2:
                assert arg.keys() == ex_arg.keys()
                for k, v in arg.items():
                    assert np.array_equal(v, ex_arg[k])
            else:
                assert stream_stuff['args'][i] == expected_args[i]

        assert stream_stuff['kwargs'] == {}

        assert len(notify_owners_stuff['args']) == 1
        self._assert_equal_dicts_of_arrays(notify_owners_stuff['args'][0],
                                           dict(a=np.array([10]),
                                                b=np.array([20]),
                                                c=np.array([30])))

        self._assert_equal_dicts_of_arrays(dict(ds.data),
                                           dict(a=np.array([10, 11, 12]),
                                                b=np.array([20, 21, 22]),
                                                c=np.array([30, 31, 32])))

    def test_stream_df_to_ds_created_from_df_default_index(self, pd) -> None:
        data = pd.DataFrame(dict(a=[10], b=[20], c=[30]))
        ds = bms.ColumnDataSource(data)
        ds._document = "doc"

        notify_owners_stuff = {}

        def notify_owners_mock(*args, **kw):
            notify_owners_stuff['args'] = args
            notify_owners_stuff['kw'] = kw

        ds.data._notify_owners = notify_owners_mock

        stream_stuff = {}
        data_stream = ds.data._stream

        def stream_wrapper(*args, **kwargs):
            stream_stuff['args'] = args
            stream_stuff['kwargs'] = kwargs
            data_stream(*args, **kwargs)

        ds.data._stream = stream_wrapper

        ds._stream(pd.DataFrame(dict(a=[11, 12],
                                     b=[21, 22],
                                     c=[31, 32])), 7)

        assert len(stream_stuff['args']) == 5
        expected_df = pd.DataFrame(dict(a=np.array([11, 12]),
                                        b=np.array([21, 22]),
                                        c=np.array([31, 32])))
        expected_stream_data = expected_df.to_dict('series')
        expected_stream_data['index'] = expected_df.index.values
        expected_args = ("doc", ds, expected_stream_data, 7, None)
        for i, (arg, ex_arg) in enumerate(zip(stream_stuff['args'], expected_args)):
            if i == 2:
                for k, v in arg.items():
                    assert np.array_equal(v, ex_arg[k])
            else:
                assert stream_stuff['args'][i] == expected_args[i]

        assert stream_stuff['kwargs'] == {}

        assert len(notify_owners_stuff['args']) == 1
        self._assert_equal_dicts_of_arrays(notify_owners_stuff['args'][0],
                                           dict(a=np.array([10]),
                                                b=np.array([20]),
                                                c=np.array([30]),
                                                index=np.array([0])))

        self._assert_equal_dicts_of_arrays(dict(ds.data),
                                           dict(a=np.array([10, 11, 12]),
                                                b=np.array([20, 21, 22]),
                                                c=np.array([30, 31, 32]),
                                                index=np.array([0, 0, 1])))

    def test_patch_bad_columns(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        with pytest.raises(ValueError, match=r"Can only patch existing columns \(extra: c\)"):
            ds.patch(dict(c=[(0, 100)]))
        with pytest.raises(ValueError, match=r"Can only patch existing columns \(extra: c, d\)"):
            ds.patch(dict(a=[(0,100)], c=[(0, 100)], d=[(0, 100)]))


    def test_patch_bad_simple_indices(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        with pytest.raises(ValueError, match=r"Out-of bounds index \(3\) in patch for column: a"):
            ds.patch(dict(a=[(3, 100)]))

    def test_patch_good_simple_indices(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        ds._document = "doc"
        stuff = {}
        mock_setter = object()
        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._patch = mock
        ds.patch(dict(a=[(0,100), (1,101)], b=[(0,200)]), mock_setter)
        assert stuff['args'] == ("doc", ds, dict(a=[(0,100), (1,101)], b=[(0,200)]), mock_setter)
        assert stuff['kw'] == {}

    def test_patch_bad_slice_indices(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10, 11, 12, 13, 14, 15], b=[20, 21, 22, 23, 24, 25]))
        with pytest.raises(ValueError, match=r"Out-of bounds slice index stop \(10\) in patch for column: a"):
            ds.patch(dict(a=[(slice(10), list(range(10)))]))
        with pytest.raises(ValueError, match=r"Patch slices must have start < end, got slice\(10, 1, None\)"):
            ds.patch(dict(a=[(slice(10, 1), list(range(10)))]))
        with pytest.raises(ValueError, match=r"Patch slices must have non-negative \(start, stop, step\) values, got slice\(None, 10, -1\)"):
            ds.patch(dict(a=[(slice(None, 10, -1), list(range(10)))]))
        with pytest.raises(ValueError, match=r"Patch slices must have start < end, got slice\(10, 1, 1\)"):
            ds.patch(dict(a=[(slice(10, 1, 1), list(range(10)))]))
        with pytest.raises(ValueError, match=r"Patch slices must have start < end, got slice\(10, 1, -1\)"):
            ds.patch(dict(a=[(slice(10, 1, -1), list(range(10)))]))
        with pytest.raises(ValueError, match=r"Patch slices must have non-negative \(start, stop, step\) values, got slice\(1, 10, -1\)"):
            ds.patch(dict(a=[(slice(1, 10, -1), list(range(10)))]))


    def test_patch_good_slice_indices(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10, 11, 12, 13, 14, 15], b=[20, 21, 22, 23, 24, 25]))
        ds._document = "doc"
        stuff = {}
        mock_setter = object()
        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._patch = mock
        ds.patch(dict(a=[(slice(2), [100, 101]), (slice(3, 5), [100, 101])], b=[(slice(0, None, 2), [100, 101, 102])]), mock_setter)
        assert stuff['args'] == ("doc", ds, dict(a=[(slice(2), [100, 101]), (slice(3, 5), [100, 101])], b=[(slice(0, None, 2), [100, 101, 102])]), mock_setter)
        assert stuff['kw'] == {}

    def test_data_column_lengths(self) -> None:
        # TODO: use this when soft=False
        #
        #with pytest.raises(ValueError):
        #    bms.ColumnDataSource(data=dict(a=[10, 11], b=[20, 21, 22]))
        #
        #ds = bms.ColumnDataSource()
        #with pytest.raises(ValueError):
        #    ds.data = dict(a=[10, 11], b=[20, 21, 22])
        #
        #ds = bms.ColumnDataSource(data=dict(a=[10, 11]))
        #with pytest.raises(ValueError):
        #    ds.data["b"] = [20, 21, 22]
        #
        #ds = bms.ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        #with pytest.raises(ValueError):
        #    ds.data.update(dict(a=[10, 11, 12]))

        with warnings.catch_warnings(record=True) as warns:
            bms.ColumnDataSource(data=dict(a=[10, 11], b=[20, 21, 22]))
        assert len(warns) == 1
        assert str(warns[0].message) == "ColumnDataSource's columns must be of the same length. Current lengths: ('a', 2), ('b', 3)"

        ds = bms.ColumnDataSource()
        with warnings.catch_warnings(record=True) as warns:
            ds.data = dict(a=[10, 11], b=[20, 21, 22])
        assert len(warns) == 1
        assert str(warns[0].message) == "ColumnDataSource's columns must be of the same length. Current lengths: ('a', 2), ('b', 3)"

        ds = bms.ColumnDataSource(data=dict(a=[10, 11]))
        with warnings.catch_warnings(record=True) as warns:
            ds.data["b"] = [20, 21, 22]
        assert len(warns) == 1
        assert str(warns[0].message) == "ColumnDataSource's columns must be of the same length. Current lengths: ('a', 2), ('b', 3)"

        ds = bms.ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        with warnings.catch_warnings(record=True) as warns:
            ds.data.update(dict(a=[10, 11, 12]))
        assert len(warns) == 1
        assert str(warns[0].message) == "ColumnDataSource's columns must be of the same length. Current lengths: ('a', 3), ('b', 2)"

    def test_set_data_from_json_list(self) -> None:
        ds = bms.ColumnDataSource()
        data = {"foo": [1, 2, 3]}
        ds.set_from_json('data', data)
        assert ds.data == data

    def test_set_data_from_json_base64(self) -> None:
        ds = bms.ColumnDataSource()
        data = {"foo": np.arange(3, dtype=np.int64)}
        json = transform_column_source_data(data)
        ds.set_from_json('data', json)
        assert np.array_equal(ds.data["foo"], data["foo"])

    def test_set_data_from_json_nested_base64(self) -> None:
        ds = bms.ColumnDataSource()
        data = {"foo": [[np.arange(3, dtype=np.int64)]]}
        json = transform_column_source_data(data)
        ds.set_from_json('data', json)
        assert np.array_equal(ds.data["foo"], data["foo"])

    def test_set_data_from_json_nested_base64_and_list(self) -> None:
        ds = bms.ColumnDataSource()
        data = {"foo": [np.arange(3, dtype=np.int64), [1, 2, 3]]}
        json = transform_column_source_data(data)
        ds.set_from_json('data', json)
        assert np.array_equal(ds.data["foo"], data["foo"])

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
