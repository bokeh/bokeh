from __future__ import absolute_import

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
    def test_init_pandas_arg(self):
        data = dict(a=[1, 2], b=[2, 3])
        df = pd.DataFrame(data)
        ds = ColumnDataSource(df)
        self.assertTrue(set(df.columns).issubset(set(ds.column_names)))
        for key in data.keys():
            self.assertEquals(list(df[key]), data[key])
        self.assertEqual(set(ds.column_names) - set(df.columns), set(["index"]))

    @skipIf(not is_pandas, "pandas not installed")
    def test_init_pandas_data_kwarg(self):
        data = dict(a=[1, 2], b=[2, 3])
        df = pd.DataFrame(data)
        ds = ColumnDataSource(data=df)
        self.assertTrue(set(df.columns).issubset(set(ds.column_names)))
        for key in data.keys():
            self.assertEquals(list(df[key]), data[key])
        self.assertEqual(set(ds.column_names) - set(df.columns), set(["index"]))

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

    def test_stream_good_data(self):
        ds = ColumnDataSource(data=dict(a=[10], b=[20]))
        ds._document = "doc"
        stuff = {}
        mock_setter = object()
        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._stream = mock
        ds.stream(dict(a=[11, 12], b=[21, 22]), "foo", mock_setter)
        self.assertEqual(stuff['args'], ("doc", ds, dict(a=[11, 12], b=[21, 22]), "foo", mock_setter))
        self.assertEqual(stuff['kw'], {})

    def test_patch_bad_data(self):
        ds = ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        with self.assertRaises(ValueError) as cm:
            ds.patch(dict(a=[(3, 100)]))
        self.assertEqual(str(cm.exception), "Out-of bounds index (3) in patch for column: a")
        with self.assertRaises(ValueError) as cm:
            ds.patch(dict(c=[(0, 100)]))
        self.assertEqual(str(cm.exception), "Can only patch existing columns (extra: c)")
        with self.assertRaises(ValueError) as cm:
            ds.patch(dict(a=[(0,100)], c=[(0, 100)], d=[(0, 100)]))
        self.assertEqual(str(cm.exception), "Can only patch existing columns (extra: c, d)")

    def test_patch_good_data(self):
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
            self.assertEquals(str(warns[0].message), "ColumnDataSource's columns must be of the same length")

        ds = ColumnDataSource()
        with warnings.catch_warnings(record=True) as warns:
            ds.data = dict(a=[10, 11], b=[20, 21, 22])
            self.assertEquals(len(warns), 1)
            self.assertEquals(str(warns[0].message), "ColumnDataSource's columns must be of the same length")

        ds = ColumnDataSource(data=dict(a=[10, 11]))
        with warnings.catch_warnings(record=True) as warns:
            ds.data["b"] = [20, 21, 22]
            self.assertEquals(len(warns), 1)
            self.assertEquals(str(warns[0].message), "ColumnDataSource's columns must be of the same length")

        ds = ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        with warnings.catch_warnings(record=True) as warns:
            ds.data.update(dict(a=[10, 11, 12]))
            self.assertEquals(len(warns), 1)
            self.assertEquals(str(warns[0].message), "ColumnDataSource's columns must be of the same length")

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
