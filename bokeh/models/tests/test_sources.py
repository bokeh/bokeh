from __future__ import absolute_import

import io
import unittest
from unittest import skipIf
import warnings

import numpy as np
try:
    import pandas as pd
    is_pandas = True
except ImportError as e:
    is_pandas = False

from bokeh.models.sources import DataSource, ColumnDataSource
from bokeh.util.serialization import transform_column_source_data

class TestColumnDataSource(unittest.TestCase):

    def test_basic(self):
        ds = ColumnDataSource()
        self.assertTrue(isinstance(ds, DataSource))

    def test_init_dict_arg(self):
        data = dict(a=[1], b=[2])
        ds = ColumnDataSource(data)
        self.assertEquals(ds.data, data)
        self.assertEquals(set(ds.column_names), set(data.keys()))

    def test_init_dict_data_kwarg(self):
        data = dict(a=[1], b=[2])
        ds = ColumnDataSource(data=data)
        self.assertEquals(ds.data, data)
        self.assertEquals(set(ds.column_names), set(data.keys()))

    @skipIf(not is_pandas, "pandas not installed")
    def test_init_dataframe_arg(self):
        data = dict(a=[1, 2], b=[2, 3])
        df = pd.DataFrame(data)
        ds = ColumnDataSource(df)
        self.assertTrue(set(df.columns).issubset(set(ds.column_names)))
        for key in data.keys():
            self.assertIsInstance(ds.data[key], np.ndarray)
            self.assertEquals(list(df[key]), list(ds.data[key]))
        self.assertIsInstance(ds.data['index'], np.ndarray)
        self.assertEquals([0, 1], list(ds.data['index']))
        self.assertEqual(set(ds.column_names) - set(df.columns), set(["index"]))

    @skipIf(not is_pandas, "pandas not installed")
    def test_init_dataframe_data_kwarg(self):
        data = dict(a=[1, 2], b=[2, 3])
        df = pd.DataFrame(data)
        ds = ColumnDataSource(data=df)
        self.assertTrue(set(df.columns).issubset(set(ds.column_names)))
        for key in data.keys():
            self.assertIsInstance(ds.data[key], np.ndarray)
            self.assertEquals(list(df[key]), list(ds.data[key]))
        self.assertIsInstance(ds.data['index'], np.ndarray)
        self.assertEquals([0, 1], list(ds.data['index']))
        self.assertEqual(set(ds.column_names) - set(df.columns), set(["index"]))

    @skipIf(not is_pandas, "pandas not installed")
    def test_init_groupby_arg(self):
        from bokeh.sampledata.autompg import autompg as df
        group = df.groupby(('origin', 'cyl'))
        ds = ColumnDataSource(group)
        s = group.describe()
        self.assertTrue(len(ds.column_names)) == 41
        self.assertIsInstance(ds.data['origin_cyl'], np.ndarray)
        for key in s.columns.values:
            k2 = "_".join(key)
            self.assertIsInstance(ds.data[k2], np.ndarray)
            self.assertEquals(list(s[key]), list(ds.data[k2]))

    @skipIf(not is_pandas, "pandas not installed")
    def test_init_groupby_data_kwarg(self):
        from bokeh.sampledata.autompg import autompg as df
        group = df.groupby(('origin', 'cyl'))
        ds = ColumnDataSource(data=group)
        s = group.describe()
        self.assertTrue(len(ds.column_names)) == 41
        self.assertIsInstance(ds.data['origin_cyl'], np.ndarray)
        for key in s.columns.values:
            k2 = "_".join(key)
            self.assertIsInstance(ds.data[k2], np.ndarray)
            self.assertEquals(list(s[key]), list(ds.data[k2]))

    @skipIf(not is_pandas, "pandas not installed")
    def test_init_groupby_with_None_subindex_name(self):
        df = pd.DataFrame({"A": [1, 2, 3, 4] * 2, "B": [10, 20, 30, 40] * 2, "C": range(8)})
        group = df.groupby(['A', [10, 20, 30, 40] * 2])
        ds = ColumnDataSource(data=group)
        s = group.describe()
        self.assertTrue(len(ds.column_names)) == 41
        self.assertIsInstance(ds.data['index'], np.ndarray)
        for key in s.columns.values:
            k2 = "_".join(key)
            self.assertIsInstance(ds.data[k2], np.ndarray)
            self.assertEquals(list(s[key]), list(ds.data[k2]))

    def test_add_with_name(self):
        ds = ColumnDataSource()
        name = ds.add([1,2,3], name="foo")
        self.assertEquals(name, "foo")
        name = ds.add([4,5,6], name="bar")
        self.assertEquals(name, "bar")

    def test_add_without_name(self):
        ds = ColumnDataSource()
        name = ds.add([1,2,3])
        self.assertEquals(name, "Series 0")
        name = ds.add([4,5,6])
        self.assertEquals(name, "Series 1")

    def test_add_with_and_without_name(self):
        ds = ColumnDataSource()
        name = ds.add([1,2,3], "foo")
        self.assertEquals(name, "foo")
        name = ds.add([4,5,6])
        self.assertEquals(name, "Series 1")

    def test_remove_exists(self):
        ds = ColumnDataSource()
        name = ds.add([1,2,3], "foo")
        assert name
        ds.remove("foo")
        self.assertEquals(ds.column_names, [])

    def test_remove_exists2(self):
        with warnings.catch_warnings(record=True) as w:
            ds = ColumnDataSource()
            ds.remove("foo")
            self.assertEquals(ds.column_names, [])
            self.assertEquals(len(w), 1)
            self.assertEquals(w[0].category, UserWarning)
            self.assertEquals(str(w[0].message), "Unable to find column 'foo' in data source")

    def test_stream_bad_data(self):
        ds = ColumnDataSource(data=dict(a=[10], b=[20]))
        with self.assertRaises(ValueError) as cm:
            ds.stream(dict())
        self.assertEqual(str(cm.exception), "Must stream updates to all existing columns (missing: a, b)")
        with self.assertRaises(ValueError) as cm:
            ds.stream(dict(a=[10]))
        self.assertEqual(str(cm.exception), "Must stream updates to all existing columns (missing: b)")
        with self.assertRaises(ValueError) as cm:
            ds.stream(dict(a=[10], b=[10], x=[10]))
        self.assertEqual(str(cm.exception), "Must stream updates to all existing columns (extra: x)")
        with self.assertRaises(ValueError) as cm:
            ds.stream(dict(a=[10], x=[10]))
        self.assertEqual(str(cm.exception), "Must stream updates to all existing columns (missing: b, extra: x)")
        with self.assertRaises(ValueError) as cm:
            ds.stream(dict(a=[10], b=[10, 20]))
        self.assertEqual(str(cm.exception), "All streaming column updates must be the same length")

        with self.assertRaises(ValueError) as cm:
            ds.stream(dict(a=[10], b=np.ones((1,1))))
        self.assertTrue(
            str(cm.exception).startswith("stream(...) only supports 1d sequences, got ndarray with size (")
        )

    @skipIf(not is_pandas, "pandas not installed")
    def test__df_index_name_with_named_index(self):
        df = pd.DataFrame(dict(a=[10], b=[20], c=[30])).set_index('c')
        assert ColumnDataSource._df_index_name(df) == "c"

    @skipIf(not is_pandas, "pandas not installed")
    def test__df_index_name_with_unnamed_index(self):
        df = pd.DataFrame(dict(a=[10], b=[20], c=[30]))
        assert ColumnDataSource._df_index_name(df) == "index"

    skipIf(not is_pandas, "pandas not installed")
    def test__df_index_name_with_named_multi_index(self):
        data = io.StringIO(u'''
Fruit,Color,Count,Price
Apple,Red,3,$1.29
Apple,Green,9,$0.99
Pear,Red,25,$2.59
Pear,Green,26,$2.79
Lime,Green,99,$0.39
''')
        df = pd.read_csv(data).set_index(['Fruit', 'Color'])
        assert df.index.names == ['Fruit', 'Color']
        assert ColumnDataSource._df_index_name(df) == "Fruit_Color"

    skipIf(not is_pandas, "pandas not installed")
    def test__df_index_name_with_unnamed_multi_index(self):
        arrays = [np.array(['bar', 'bar', 'baz', 'baz', 'foo', 'foo', 'qux', 'qux']),
                  np.array(['one', 'two', 'one', 'two', 'one', 'two', 'one', 'two'])]
        df = pd.DataFrame(np.random.randn(8, 4), index=arrays)
        assert df.index.names == [None, None]
        assert ColumnDataSource._df_index_name(df) == "index"

    def test__stream_good_data(self):
        ds = ColumnDataSource(data=dict(a=[10], b=[20]))
        ds._document = "doc"
        stuff = {}
        mock_setter = object()

        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._stream = mock
        # internal implementation of stream
        ds._stream(dict(a=[11, 12], b=[21, 22]), "foo", mock_setter)
        self.assertEqual(stuff['args'], ("doc", ds, dict(a=[11, 12], b=[21, 22]), "foo", mock_setter))
        self.assertEqual(stuff['kw'], {})

    def test_stream_good_data(self):
        ds = ColumnDataSource(data=dict(a=[10], b=[20]))
        ds._document = "doc"
        stuff = {}

        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._stream = mock
        # public implementation of stream
        ds._stream(dict(a=[11, 12], b=[21, 22]), "foo")
        self.assertEqual(stuff['args'], ("doc", ds, dict(a=[11, 12], b=[21, 22]), "foo", None))
        self.assertEqual(stuff['kw'], {})

    def _assert_equal_dicts_of_arrays(self, d1, d2):
        self.assertEqual(d1.keys(), d2.keys())
        for k, v in d1.items():
            self.assertEqual(type(v), type(d2[k]))
            self.assertTrue(np.array_equal(v, d2[k]))

    @skipIf(not is_pandas, "pandas not installed")
    def test_stream_dict_to_ds_created_from_df(self):
        data = pd.DataFrame(dict(a=[10], b=[20], c=[30])).set_index('c')
        ds = ColumnDataSource(data)
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

        self.assertEqual(len(stream_stuff['args']), 5)
        expected_stream_args = ("doc", ds, dict(a=[11, 12],
                                                b=np.array([21, 22]),
                                                c=pd.Series([31, 32])), 7, None)
        for i, (arg, ex_arg) in enumerate(zip(stream_stuff['args'],
                                              expected_stream_args)):
            if i == 2:
                self.assertEqual(arg['a'], ex_arg['a'])
                del arg['a'], ex_arg['a']
                self._assert_equal_dicts_of_arrays(arg, ex_arg)
            else:
                self.assertEqual(arg, ex_arg)

        self.assertEqual(stream_stuff['kwargs'], {})

        self.assertEqual(len(notify_owners_stuff['args']), 1)
        self._assert_equal_dicts_of_arrays(notify_owners_stuff['args'][0],
                                           dict(a=np.array([10]),
                                                b=np.array([20]),
                                                c=np.array([30])))

        self._assert_equal_dicts_of_arrays(dict(ds.data),
                                           dict(a=np.array([10, 11, 12]),
                                                b=np.array([20, 21, 22]),
                                                c=np.array([30, 31, 32])))

    @skipIf(not is_pandas, "pandas not installed")
    def test_stream_series_to_ds_created_from_df(self):
        data = pd.DataFrame(dict(a=[10], b=[20], c=[30]))
        ds = ColumnDataSource(data)
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

        self.assertEqual(len(stream_stuff['args']), 5)
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
                self.assertEqual(arg, ex_arg)

        self.assertEqual(stream_stuff['kwargs'], {})

        self.assertEqual(len(notify_owners_stuff['args']), 1)
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

    @skipIf(not is_pandas, "pandas not installed")
    def test_stream_df_to_ds_created_from_df_named_index(self):
        data = pd.DataFrame(dict(a=[10], b=[20], c=[30])).set_index('c')
        ds = ColumnDataSource(data)
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

        self.assertEqual(len(stream_stuff['args']), 5)
        expected_steam_data = dict(a=np.array([11, 12]),
                                   b=np.array([21, 22]),
                                   c=np.array([31, 32]))
        expected_args = ("doc", ds, expected_steam_data, 7, None)
        for i, (arg, ex_arg) in enumerate(zip(stream_stuff['args'], expected_args)):
            if i == 2:
                self.assertEqual(arg.keys(), ex_arg.keys())
                for k, v in arg.items():
                    self.assertTrue(np.array_equal(v, ex_arg[k]))
            else:
                self.assertEqual(stream_stuff['args'][i], expected_args[i])

        self.assertEqual(stream_stuff['kwargs'], {})

        self.assertEqual(len(notify_owners_stuff['args']), 1)
        self._assert_equal_dicts_of_arrays(notify_owners_stuff['args'][0],
                                           dict(a=np.array([10]),
                                                b=np.array([20]),
                                                c=np.array([30])))

        self._assert_equal_dicts_of_arrays(dict(ds.data),
                                           dict(a=np.array([10, 11, 12]),
                                                b=np.array([20, 21, 22]),
                                                c=np.array([30, 31, 32])))

    @skipIf(not is_pandas, "pandas not installed")
    def test_stream_df_to_ds_created_from_df_default_index(self):
        data = pd.DataFrame(dict(a=[10], b=[20], c=[30]))
        ds = ColumnDataSource(data)
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

        self.assertEqual(len(stream_stuff['args']), 5)
        expected_df = pd.DataFrame(dict(a=np.array([11, 12]),
                                        b=np.array([21, 22]),
                                        c=np.array([31, 32])))
        expected_stream_data = expected_df.to_dict('series')
        expected_stream_data['index'] = expected_df.index.values
        expected_args = ("doc", ds, expected_stream_data, 7, None)
        for i, (arg, ex_arg) in enumerate(zip(stream_stuff['args'], expected_args)):
            if i == 2:
                for k, v in arg.items():
                    self.assertTrue(np.array_equal(v, ex_arg[k]))
            else:
                self.assertEqual(stream_stuff['args'][i], expected_args[i])

        self.assertEqual(stream_stuff['kwargs'], {})

        self.assertEqual(len(notify_owners_stuff['args']), 1)
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

    def test_patch_bad_columns(self):
        ds = ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        with self.assertRaises(ValueError) as cm:
            ds.patch(dict(c=[(0, 100)]))
        self.assertEqual(str(cm.exception), "Can only patch existing columns (extra: c)")
        with self.assertRaises(ValueError) as cm:
            ds.patch(dict(a=[(0,100)], c=[(0, 100)], d=[(0, 100)]))
        self.assertEqual(str(cm.exception), "Can only patch existing columns (extra: c, d)")


    def test_patch_bad_simple_indices(self):
        ds = ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        with self.assertRaises(ValueError) as cm:
            ds.patch(dict(a=[(3, 100)]))
        self.assertEqual(str(cm.exception), "Out-of bounds index (3) in patch for column: a")

    def test_patch_good_simple_indices(self):
        ds = ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        ds._document = "doc"
        stuff = {}
        mock_setter = object()
        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._patch = mock
        ds.patch(dict(a=[(0,100), (1,101)], b=[(0,200)]), mock_setter)
        self.assertEqual(stuff['args'], ("doc", ds, dict(a=[(0,100), (1,101)], b=[(0,200)]), mock_setter))
        self.assertEqual(stuff['kw'], {})

    def test_patch_bad_slice_indices(self):
        ds = ColumnDataSource(data=dict(a=[10, 11, 12, 13, 14, 15], b=[20, 21, 22, 23, 24, 25]))
        with self.assertRaises(ValueError) as cm:
            ds.patch(dict(a=[(slice(10), list(range(10)))]))
        self.assertEqual(str(cm.exception), "Out-of bounds slice index stop (10) in patch for column: a")
        with self.assertRaises(ValueError) as cm:
            ds.patch(dict(a=[(slice(10, 1), list(range(10)))]))
        self.assertEqual(str(cm.exception), "Patch slices must have start < end, got slice(10, 1, None)")
        with self.assertRaises(ValueError) as cm:
            ds.patch(dict(a=[(slice(None, 10, -1), list(range(10)))]))
        self.assertEqual(str(cm.exception), "Patch slices must have non-negative (start, stop, step) values, got slice(None, 10, -1)")
        with self.assertRaises(ValueError) as cm:
            ds.patch(dict(a=[(slice(10, 1, 1), list(range(10)))]))
        self.assertEqual(str(cm.exception), "Patch slices must have start < end, got slice(10, 1, 1)")
        with self.assertRaises(ValueError) as cm:
            ds.patch(dict(a=[(slice(10, 1, -1), list(range(10)))]))
        self.assertEqual(str(cm.exception), "Patch slices must have start < end, got slice(10, 1, -1)")
        with self.assertRaises(ValueError) as cm:
            ds.patch(dict(a=[(slice(1, 10, -1), list(range(10)))]))
        self.assertEqual(str(cm.exception), "Patch slices must have non-negative (start, stop, step) values, got slice(1, 10, -1)")


    def test_patch_good_slice_indices(self):
        ds = ColumnDataSource(data=dict(a=[10, 11, 12, 13, 14, 15], b=[20, 21, 22, 23, 24, 25]))
        ds._document = "doc"
        stuff = {}
        mock_setter = object()
        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._patch = mock
        ds.patch(dict(a=[(slice(2), [100, 101]), (slice(3, 5), [100, 101])], b=[(slice(0, None, 2), [100, 101, 102])]), mock_setter)
        self.assertEqual(stuff['args'],
            ("doc", ds, dict(a=[(slice(2), [100, 101]), (slice(3, 5), [100, 101])], b=[(slice(0, None, 2), [100, 101, 102])]), mock_setter)
        )
        self.assertEqual(stuff['kw'], {})

    def test_data_column_lengths(self):
        # TODO: use this when soft=False
        #
        #with self.assertRaises(ValueError):
        #    ColumnDataSource(data=dict(a=[10, 11], b=[20, 21, 22]))
        #
        #ds = ColumnDataSource()
        #with self.assertRaises(ValueError):
        #    ds.data = dict(a=[10, 11], b=[20, 21, 22])
        #
        #ds = ColumnDataSource(data=dict(a=[10, 11]))
        #with self.assertRaises(ValueError):
        #    ds.data["b"] = [20, 21, 22]
        #
        #ds = ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        #with self.assertRaises(ValueError):
        #    ds.data.update(dict(a=[10, 11, 12]))

        with warnings.catch_warnings(record=True) as warns:
            ColumnDataSource(data=dict(a=[10, 11], b=[20, 21, 22]))
            self.assertEquals(len(warns), 1)
            self.assertEquals(str(warns[0].message), "ColumnDataSource's columns must be of the same length. Current lengths: ('a', 2), ('b', 3)")

        ds = ColumnDataSource()
        with warnings.catch_warnings(record=True) as warns:
            ds.data = dict(a=[10, 11], b=[20, 21, 22])
            self.assertEquals(len(warns), 1)
            self.assertEquals(str(warns[0].message), "ColumnDataSource's columns must be of the same length. Current lengths: ('a', 2), ('b', 3)")

        ds = ColumnDataSource(data=dict(a=[10, 11]))
        with warnings.catch_warnings(record=True) as warns:
            ds.data["b"] = [20, 21, 22]
            self.assertEquals(len(warns), 1)
            self.assertEquals(str(warns[0].message), "ColumnDataSource's columns must be of the same length. Current lengths: ('a', 2), ('b', 3)")

        ds = ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        with warnings.catch_warnings(record=True) as warns:
            ds.data.update(dict(a=[10, 11, 12]))
            self.assertEquals(len(warns), 1)
            self.assertEquals(str(warns[0].message), "ColumnDataSource's columns must be of the same length. Current lengths: ('a', 3), ('b', 2)")

    def test_set_data_from_json_list(self):
        ds = ColumnDataSource()
        data = {"foo": [1, 2, 3]}
        ds.set_from_json('data', data)
        self.assertEquals(ds.data, data)

    def test_set_data_from_json_base64(self):
        ds = ColumnDataSource()
        data = {"foo": np.arange(3)}
        json = transform_column_source_data(data)
        ds.set_from_json('data', json)
        self.assertTrue(np.array_equal(ds.data["foo"], data["foo"]))

    def test_set_data_from_json_nested_base64(self):
        ds = ColumnDataSource()
        data = {"foo": [[np.arange(3)]]}
        json = transform_column_source_data(data)
        ds.set_from_json('data', json)
        self.assertTrue(np.array_equal(ds.data["foo"], data["foo"]))

    def test_set_data_from_json_nested_base64_and_list(self):
        ds = ColumnDataSource()
        data = {"foo": [np.arange(3), [1, 2, 3]]}
        json = transform_column_source_data(data)
        ds.set_from_json('data', json)
        self.assertTrue(np.array_equal(ds.data["foo"], data["foo"]))

if __name__ == "__main__":
    unittest.main()
