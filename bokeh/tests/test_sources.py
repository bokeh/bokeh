from __future__ import absolute_import

import unittest
from unittest import skipIf
import warnings

try:
    import pandas as pd
    is_pandas = True
except ImportError as e:
    is_pandas = False

from bokeh.models.sources import DataSource, ColumnDataSource, ServerDataSource

class TestColumnDataSourcs(unittest.TestCase):

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

class TestServerDataSourcs(unittest.TestCase):

    def test_basic(self):
        ds = ServerDataSource()
        self.assertTrue(isinstance(ds, DataSource))

if __name__ == "__main__":
    unittest.main()
