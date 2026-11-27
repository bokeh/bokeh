#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
import datetime as dt
import io
import warnings
from dataclasses import asdict, dataclass
from pathlib import Path
from types import MappingProxyType

import narwhals.stable.v1 as nw
import numpy as np
import pytest

from bokeh.core.property.singletons import Undefined
from bokeh.document import Document
from bokeh.document.events import ColumnDataChangedEvent
from bokeh.models import (
    ColumnDataSource,
    DataTable,
    NumberFormatter,
    Selection,
)
from bokeh.util.callback_manager import OldValueUnavailable
from bokeh.util.dependencies import is_installed
from bokeh.util.serialization import convert_datetime_array

# Module under test
import bokeh.models.sources as bms # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

if is_installed("pandas"):
    import pandas as pd
    df = pd.read_csv(Path(__file__).parents[1] / "auto-mpg.csv")
else:
    pd = None

@dataclass
class DataclassData:
    a: list[int]
    b: list[int]

def _assert_column(ds: bms.ColumnDataSource, expected: list[int]) -> None:
    actual = ds.data["a"]
    if isinstance(actual, np.ndarray):
        assert np.array_equal(actual, np.array(expected))
    else:
        assert actual == expected

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestColumnDataSource:
    def test_basic(self) -> None:
        ds = bms.ColumnDataSource()
        assert isinstance(ds, bms.DataSource)
        assert isinstance(ds.selected, Selection)
        assert ds.length == 0

    def test_selected_is_readonly(self) -> None:
        ds = bms.ColumnDataSource()
        with pytest.raises(RuntimeError) as e:
            ds.selected = Selection()
        assert str(e.value).endswith("ColumnDataSource.selected is a readonly property")

    def test_selected_serialized(self) -> None:
        ds = bms.ColumnDataSource()
        prop = ds.lookup('selected')
        assert prop.serialized is True

    def test_init_dict_arg(self) -> None:
        data = dict(a=[1], b=[2])
        ds = bms.ColumnDataSource(data)
        assert ds.data == data
        assert set(ds.column_names) == set(data.keys())
        assert ds.length == 1

    def test_init_dict_data_kwarg(self) -> None:
        data = dict(a=[1], b=[2])
        ds = bms.ColumnDataSource(data=data)
        assert ds.data == data
        assert set(ds.column_names) == set(data.keys())
        assert ds.length == 1

    def test_init_dataclass_arg(self) -> None:
        data = DataclassData(a=[1], b=[2])
        ds = bms.ColumnDataSource(data)
        assert ds.data == asdict(data)
        assert set(ds.column_names) == set(asdict(data))
        assert ds.length == 1

    def test_init_dataclass_data_kwarg(self) -> None:
        data = DataclassData(a=[1], b=[2])
        ds = bms.ColumnDataSource(data=data)
        assert ds.data == asdict(data)
        assert set(ds.column_names) == set(asdict(data))
        assert ds.length == 1

    def test_data_accepts_dataframe_arg(self, constructor) -> None:
        data = dict(a=[1, 2], b=[2, 3])
        df = nw.from_native(constructor(data), eager_only=True)
        ds = bms.ColumnDataSource()
        assert ds.data == {}
        ds.data = df.to_native()
        assert set(df.columns).issubset(set(ds.column_names))
        for key in data.keys():
            assert isinstance(ds.data[key], np.ndarray)
            assert df[key].to_list() == list(ds.data[key])
        assert isinstance(ds.data['index'], np.ndarray)
        assert [0, 1] == list(ds.data['index'])
        assert set(ds.column_names) - set(df.columns) == {"index"}
        assert ds.length == 2

    def test_init_dataframe_data_kwarg(self, constructor) -> None:
        data = dict(a=[1, 2], b=[2, 3])
        df = nw.from_native(constructor(data), eager_only=True)
        ds = bms.ColumnDataSource(data=df.to_native())
        assert set(df.columns).issubset(set(ds.column_names))
        for key in data.keys():
            assert isinstance(ds.data[key], np.ndarray)
            assert df[key].to_list() == list(ds.data[key])
        assert isinstance(ds.data['index'], np.ndarray)
        assert [0, 1] == list(ds.data['index'])
        assert set(ds.column_names) - set(df.columns) == {"index"}
        assert ds.length == 2

    def test_init_dataframe_index_named_column(self, constructor) -> None:
        data = dict(a=[1, 2], b=[2, 3], index=[4, 5])
        df = nw.from_native(constructor(data), eager_only=True)
        ds = bms.ColumnDataSource(data=df.to_native())
        assert set(df.columns).issubset(set(ds.column_names))
        for key in data.keys():
            assert isinstance(ds.data[key], np.ndarray)
            assert df[key].to_list() == list(ds.data[key])
        assert isinstance(ds.data['level_0'], np.ndarray)
        assert [0, 1] == list(ds.data['level_0'])
        assert set(ds.column_names) - set(df.columns) == {"level_0"}
        assert ds.length == 2

    def test_data_accepts_dataframe_index_named_column(self, constructor) -> None:
        data = dict(a=[1, 2], b=[2, 3], index=[4, 5])
        df = nw.from_native(constructor(data), eager_only=True)
        ds = bms.ColumnDataSource()
        assert ds.data == {}
        ds.data = df.to_native()
        assert set(df.columns).issubset(set(ds.column_names))
        for key in data.keys():
            assert isinstance(ds.data[key], np.ndarray)
            assert df[key].to_list() == list(ds.data[key])
        assert isinstance(ds.data['level_0'], np.ndarray)
        assert [0, 1] == list(ds.data['level_0'])
        assert set(ds.column_names) - set(df.columns) == {"level_0"}
        assert ds.length == 2

    def test_init_dataframe_index_named_column_level_0(self, constructor) -> None:
        data = dict(a=[1, 2], b=[2, 3], index=[4, 5], level_0=[2, 1])
        df = nw.from_native(constructor(data), eager_only=True)
        with pytest.raises(ValueError):
            bms.ColumnDataSource(data=df.to_native())

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
        assert ds.length == 0

    def test_remove_exists2(self) -> None:
        with pytest.warns(UserWarning, match=r"Unable to find column 'foo' in data source") as w:
            ds = bms.ColumnDataSource()
            ds.remove("foo")
            assert ds.column_names == []
            assert ds.length == 0
            assert len(w) == 1
            assert w[0].category is UserWarning
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

    def test_stream_array_to_empty_list(self) -> None:
        import numpy as np

        array = np.array([np.datetime64("2024-08-01T08:05:28")])
        source = ColumnDataSource(data=dict(foo=[]))

        source.stream(dict(foo=array))
        assert source.data["foo"] is array

    def test_stream_empty_list_to_array(self) -> None:
        import numpy as np

        array = np.array([np.datetime64("2024-08-01T08:05:28")])
        source = ColumnDataSource(data=dict(foo=array))

        source.stream(dict(foo=[]))
        assert source.data["foo"] is array

    def test_stream_to_empty_cds(self) -> None:
        source = ColumnDataSource()
        source.stream(dict(foo=[1]))

        assert source.data["foo"] == [1]

    def test_stream_to_empty_cds_dict(self) -> None:
        source1 = ColumnDataSource(data=dict())
        source1.stream(dict(foo=[1]))

        assert source1.data["foo"] == [1]

        source2 = ColumnDataSource(data=dict())
        source2.stream(dict(foo=[1, 2], bar=[3, 4]))

        assert source2.data["foo"] == [1, 2]
        assert source2.data["bar"] == [3, 4]

    def test_empty_stream_to_empty_cds(self) -> None:
        source = ColumnDataSource()
        source.stream(dict())
        assert len(source.data.keys()) == 0
        source.stream(dict(foo=[1]))

        assert source.data["foo"] == [1]

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

    def test_stream_mapping(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10], b=[20]))
        ds._document = "doc"
        stuff = {}

        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._stream = mock
        # any read-only mapping is accepted, see issue #14814
        ds.stream(MappingProxyType(dict(a=[11, 12], b=[21, 22])), "foo")
        assert stuff['args'] == ("doc", ds, dict(a=[11, 12], b=[21, 22]), "foo", None)
        assert stuff['kw'] == {}

    def test_stream_callback_old_value_unavailable(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10]))
        old_values = []
        ds.on_change("data", lambda _attr, old, _new: old_values.append(old))

        ds.stream(dict(a=[11]))

        assert old_values == [OldValueUnavailable]

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

    def test_patch_bad_columns(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        with pytest.raises(ValueError, match=r"Can only patch existing columns \(extra: c\)"):
            ds.patch(dict(c=[(0, 100)]))
        with pytest.raises(ValueError, match=r"Can only patch existing columns \(extra: c, d\)"):
            ds.patch(dict(a=[(0,100)], c=[(0, 100)], d=[(0, 100)]))

    def test_patch_callback_old_value_unavailable(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10]))
        old_values = []
        ds.on_change("data", lambda _attr, old, _new: old_values.append(old))

        ds.patch(dict(a=[(0, 11)]))

        assert old_values == [OldValueUnavailable]

    @pytest.mark.parametrize("index", [int, np.int64, np.int32], ids=["int", "int64", "int32"])
    def test_patch_bad_simple_indices(self, index: type) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        with pytest.raises(ValueError, match=r"Out-of bounds index \(3\) in patch for column: a"):
            ds.patch(dict(a=[(index(3), 100)]))
        with pytest.raises(ValueError, match=r"Out-of bounds index \(-1\) in patch for column: a"):
            ds.patch(dict(a=[(index(-1), 100)]))
        with pytest.raises(ValueError, match=r"Out-of bounds index \(2\) in patch for column: b"):
            ds.patch(dict(a=[(index(0), 100)], b=[(index(2), 100)]))
        assert ds.data == dict(a=[10, 11], b=[20, 21])

    @pytest.mark.parametrize("index", [int, np.int64, np.int32], ids=["int", "int64", "int32"])
    def test_patch_good_simple_indices(self, index: type) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        ds._document = "doc"
        stuff = {}
        mock_setter = object()
        def mock(*args, **kw):
            stuff['args'] = args
            stuff['kw'] = kw
        ds.data._patch = mock
        ds.patch(dict(a=[(index(0),100), (index(1),101)], b=[(index(0),200)]), mock_setter)
        assert stuff['args'] == ("doc", ds, dict(a=[(0,100), (1,101)], b=[(0,200)]), mock_setter)
        assert stuff['kw'] == {}

    def test_patch_numpy_bool_index(self) -> None:
        # NumPy booleans are not integers and are still rejected
        ds = bms.ColumnDataSource(data=dict(a=[10, 11]))
        with pytest.raises(ValueError, match=r"Invalid patch index: True"):
            ds.patch(dict(a=[(np.bool_(True), 100)]))
        assert ds.data == dict(a=[10, 11])

    @pytest.mark.parametrize("as_array", [False, True], ids=["list", "ndarray"])
    def test_patch_bad_slice_indices(self, as_array: bool) -> None:
        values = [10, 11, 12, 13, 14, 15]
        ds = bms.ColumnDataSource(data=dict(a=np.array(values) if as_array else values))
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
        _assert_column(ds, values)

    def test_patch_zero_slice_step(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10, 11, 12]))
        with pytest.raises(ValueError, match=r"Patch slices must have non-zero step, got slice\(0, 2, 0\)"):
            ds.patch(dict(a=[(slice(0, 2, 0), [100, 101])]))
        assert ds.data == dict(a=[10, 11, 12])

    @pytest.mark.parametrize("as_array", [False, True], ids=["list", "ndarray"])
    def test_patch_bad_slice_start(self, as_array: bool) -> None:
        values = [10, 11, 12, 13, 14, 15]
        ds = bms.ColumnDataSource(data=dict(a=np.array(values) if as_array else values))
        with pytest.raises(ValueError, match=r"Out-of bounds slice index start \(7\) in patch for column: a"):
            ds.patch(dict(a=[(slice(7, None), [100])]))
        _assert_column(ds, values)
        with pytest.raises(ValueError, match=r"Patch slice for column: a expects 0 values, got 1"):
            ds.patch(dict(a=[(slice(6, None), [100])]))
        _assert_column(ds, values)

    @pytest.mark.parametrize("as_array", [False, True], ids=["list", "ndarray"])
    def test_patch_bad_slice_value_length(self, as_array: bool) -> None:
        values = [10, 11, 12, 13, 14, 15]
        ds = bms.ColumnDataSource(data=dict(a=np.array(values) if as_array else values))
        cases = [
            # expected: 1, provided: 2
            (slice(3, 4), [100, 101]),
            # expected: 2, provided: 5
            (slice(1, 3), [100, 101, 102, 103, 104]),
            # expected: 3, provided: 2
            (slice(0, 6, 2), [100, 101]),
            # expected: 3, provided: 1
            (slice(0, 6, 2), [100]),
            # expected: 4, provided: 3
            (slice(2, None), [100, 101, 102]),
        ]
        for bad_slice, patch_values in cases:
            expected = len(range(*bad_slice.indices(len(values))))
            provided = len(patch_values)
            with pytest.raises(ValueError, match=rf"Patch slice for column: a expects {expected} values, got {provided}"):
                ds.patch(dict(a=[(bad_slice, patch_values)]))
            _assert_column(ds, values)

    def test_patch_empty_slice_at_column_boundary(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10, 11, 12]))
        ds.patch(dict(a=[(slice(3, None), [])]))
        ds.patch(dict(a=[(slice(0, 0), [])]))
        assert ds.data == dict(a=[10, 11, 12])

    def test_patch_good_stepped_and_open_ended_slice_indices(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10, 11, 12, 13, 14, 15]))
        ds.patch(dict(a=[(slice(0, 6, 2), [100, 101, 102])]))
        assert ds.data == dict(a=[100, 11, 101, 13, 102, 15])
        ds.patch(dict(a=[(slice(2, None), [200, 201, 202, 203])]))
        assert ds.data == dict(a=[100, 11, 200, 201, 202, 203])

    @pytest.mark.parametrize(
        ("bad_slice", "patch_values"),
        [
            (slice(3, 1), [100, 101]),
            (slice(None, 3, -1), [100, 101, 102]),
            (slice(0, 2, 0), [100, 101]),
            (slice(5, None), [100]),
            (slice(0, 2), [100]),
            (slice(0, 2), [100, 101, 102]),
            (slice(-1, None), [100]),
            (slice(None, -1), [100]),
        ],
        ids=[
            "start_after_stop",
            "negative_step",
            "zero_step",
            "start_oob",
            "too_few_values",
            "too_many_values",
            "negative_start",
            "negative_stop",
        ],
    )
    def test_patch_invalid_slice_leaves_all_columns_unchanged(self, bad_slice: slice, patch_values: list[int]) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10, 11, 12], b=np.array([20, 21, 22])))
        with pytest.raises(ValueError):
            ds.patch(dict(a=[(slice(0, 2), [100, 101])], b=[(bad_slice, patch_values)]))
        assert ds.data["a"] == [10, 11, 12]
        assert np.array_equal(ds.data["b"], np.array([20, 21, 22]))

    def test_patch_good_multi_column_slice_indices(self) -> None:
        ds = bms.ColumnDataSource(data=dict(a=[10, 11, 12, 13], b=[20, 21, 22, 23]))
        ds.patch(dict(a=[(slice(0, 2), [100, 101])], b=[(slice(2, None), [200, 201])]))
        assert ds.data == dict(a=[100, 101, 12, 13], b=[20, 21, 200, 201])

    def test_bad_multi_index(self) -> None:
        ds = ColumnDataSource(data=dict(foo=[1]))
        with pytest.raises(ValueError, match=r"Empty \(length zero\) patch multi-index"):
            ds.patch(dict(foo=[[[], 5]]))
        with pytest.raises(ValueError, match=r"Patch multi-index must contain more than one subindex"):
            ds.patch(dict(foo=[[[2], 5]]))
        with pytest.raises(ValueError, match=r"Initial patch sub-index may only be integer, got: spam"):
            ds.patch(dict(foo=[[["spam", 3], 5]]))
        with pytest.raises(ValueError, match=r"Out-of bounds initial sub-index \(-1\) in patch for column: foo"):
            ds.patch(dict(foo=[[[-1, 3], 5]]))
        with pytest.raises(ValueError, match=r"Out-of bounds initial sub-index \(1\) in patch for column: foo"):
            ds.patch(dict(foo=[[[1, 3], 5]]))
        with pytest.raises(ValueError, match=r"Can only sub-patch into columns with NumPy array items"):
            ds.patch(dict(foo=[[[0, 3], 5]]))
        with pytest.raises(ValueError, match=r"Invalid patch index: {}"):
            ds.patch(dict(foo=[[{}, 5]]))

    def test_patch_good_numpy_integer_multi_index(self) -> None:
        ds = ColumnDataSource(data=dict(a=[np.zeros((2, 2)), np.zeros((2, 2))]))
        ds.patch(dict(a=[([np.int64(1), 0, slice(None)], [5, 6])]))
        ds.patch(dict(a=[([0, np.int64(1), slice(None)], [7, 8])]))
        assert (ds.data["a"][0] == np.array([[0, 0], [7, 8]])).all()
        assert (ds.data["a"][1] == np.array([[5, 6], [0, 0]])).all()

    def test_patch_bad_numpy_integer_multi_index(self) -> None:
        ds = ColumnDataSource(data=dict(a=[np.zeros((2, 2)), np.zeros((2, 2))]))
        with pytest.raises(ValueError, match=r"Out-of bounds initial sub-index \(2\) in patch for column: a"):
            ds.patch(dict(a=[([np.int64(2), 0, slice(None)], [5, 6])]))
        assert (ds.data["a"][0] == np.zeros((2, 2))).all()
        assert (ds.data["a"][1] == np.zeros((2, 2))).all()

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

    def test_immutable_data(self) -> None:
        a = [1, 2, 3, 4]
        b = (1, 2, 3, 4)
        c = np.array([1, 2, 3, 4])
        d = np.array([1, 2, 3, 4])
        e = np.array([[1, 2], [3, 4], [5, 6], [7, 8]])
        f = np.array([[1, 2], [3, 4], [5, 6], [7, 8]])

        d.flags.writeable = False
        f.flags.writeable = False

        ds = ColumnDataSource(data=dict(a=a, b=b, c=c, d=d, e=e, f=f))

        with warnings.catch_warnings():
            warnings.simplefilter("error")
            ds.patch(dict(a=[(1, 2000)]))
        assert ds.data["a"] == [1, 2000, 3, 4]

        with pytest.warns(UserWarning) as warns_b:
            ds.patch(dict(b=[(1, 2000)]))
        assert ds.data["b"] == (1, 2, 3, 4)
        assert len(warns_b) == 1

        with warnings.catch_warnings():
            warnings.simplefilter("error")
            ds.patch(dict(c=[(1, 2000)]))
        assert (ds.data["c"] == np.array([1, 2000, 3, 4])).all()

        with pytest.warns(UserWarning) as warns_d:
            ds.patch(dict(d=[(1, 2000)]))
        assert (ds.data["d"] == np.array([1, 2, 3, 4])).all()
        assert len(warns_d) == 1

        with warnings.catch_warnings():
            warnings.simplefilter("error")
            ds.patch(dict(e=[((0, 1), 2000)]))
        assert (ds.data["e"] == np.array([[1, 2000], [3, 4], [5, 6], [7, 8]])).all()

        with pytest.warns(UserWarning) as warns_f:
            ds.patch(dict(f=[((0, 1), 2000)]))
        assert (ds.data["f"] == np.array([[1, 2], [3, 4], [5, 6], [7, 8]])).all()
        assert len(warns_f) == 1

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

        with pytest.warns(UserWarning) as warns:
            bms.ColumnDataSource(data=dict(a=[10, 11], b=[20, 21, 22]))
        assert len(warns) == 1
        assert str(warns[0].message) == "ColumnDataSource's columns must be of the same length. Current lengths: ('a', 2), ('b', 3)"

        ds = bms.ColumnDataSource()
        with pytest.warns(UserWarning) as warns:
            ds.data = dict(a=[10, 11], b=[20, 21, 22])
        assert len(warns) == 1
        assert str(warns[0].message) == "ColumnDataSource's columns must be of the same length. Current lengths: ('a', 2), ('b', 3)"

        ds = bms.ColumnDataSource(data=dict(a=[10, 11]))
        with pytest.warns(UserWarning) as warns:
            ds.data["b"] = [20, 21, 22]
        assert len(warns) == 1
        assert str(warns[0].message) == "ColumnDataSource's columns must be of the same length. Current lengths: ('a', 2), ('b', 3)"

        ds = bms.ColumnDataSource(data=dict(a=[10, 11], b=[20, 21]))
        with pytest.warns(UserWarning) as warns:
            ds.data.update(dict(a=[10, 11, 12]))
        assert len(warns) == 1
        assert str(warns[0].message) == "ColumnDataSource's columns must be of the same length. Current lengths: ('a', 3), ('b', 2)"


class TestColumnDataSourcePandas:
    __test__ = is_installed("pandas")

    def test_init_dataframe_arg(self) -> None:
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
        assert ds.length == 2

    def test_init_produces_writable_arrays_with_Pandas3_CoW(self) -> None:
        data = dict(a=[1, 2], b=[2, 3])
        df = pd.DataFrame(data)
        ds = bms.ColumnDataSource(df)
        a = ds.data["a"]
        b = ds.data["b"]
        assert isinstance(a, np.ndarray) and a.flags.writeable is True
        assert isinstance(b, np.ndarray) and b.flags.writeable is True

    def test_init_dataframe_column_categoricalindex(self) -> None:
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
        assert ds.length == 2

    def test_data_accepts_dataframe_column_categoricalindex(self) -> None:
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
        assert ds.length == 2

    def test_init_dataframe_nonstring_named_column(self) -> None:
        data = {1: [1, 2], 2: [2, 3]}
        df = pd.DataFrame(data)
        with pytest.raises(ValueError, match=r'expected a dict of type.*'):
            bms.ColumnDataSource(data=df)

    def test_init_dataframe_nonstring_named_multicolumn(self) -> None:
        data = {(1, 2): [1, 2], (2, 3): [2, 3]}
        df = pd.DataFrame(data)
        with pytest.raises(TypeError, match=r'Could not flatten.*'):
            bms.ColumnDataSource(data=df)

    def test_init_groupby_arg(self) -> None:
        group = df.groupby(by=['origin', 'cyl'])
        ds = bms.ColumnDataSource(group)
        s = group.describe()
        assert len(ds.column_names) == 49
        assert ds.length == 9
        assert isinstance(ds.data['origin_cyl'], np.ndarray)
        for key in s.columns.values:
            k2 = "_".join(key)
            assert isinstance(ds.data[k2], np.ndarray)
            assert list(s[key]) == list(ds.data[k2])

    def test_data_accepts_groupby_arg(self) -> None:
        group = df.groupby(by=['origin', 'cyl'])
        ds = bms.ColumnDataSource()
        assert ds.data == {}
        ds.data = group
        s = group.describe()
        assert len(ds.column_names) == 49
        assert ds.length == 9
        assert isinstance(ds.data['origin_cyl'], np.ndarray)
        for key in s.columns.values:
            k2 = "_".join(key)
            assert isinstance(ds.data[k2], np.ndarray)
            assert list(s[key]) == list(ds.data[k2])

    def test_init_groupby_data_kwarg(self) -> None:
        group = df.groupby(by=['origin', 'cyl'])
        ds = bms.ColumnDataSource(data=group)
        s = group.describe()
        assert len(ds.column_names) == 49
        assert ds.length == 9
        assert isinstance(ds.data['origin_cyl'], np.ndarray)
        for key in s.columns.values:
            k2 = "_".join(key)
            assert isinstance(ds.data[k2], np.ndarray)
            assert list(s[key]) == list(ds.data[k2])

    def test_init_groupby_with_None_subindex_name(self) -> None:
        df = pd.DataFrame({"A": [1, 2, 3, 4] * 2, "B": [10, 20, 30, 40] * 2, "C": range(8)})
        group = df.groupby(['A', [10, 20, 30, 40] * 2])
        ds = bms.ColumnDataSource(data=group)
        s = group.describe()
        assert len(ds.column_names) == 17
        assert ds.length == 4
        assert isinstance(ds.data['index'], np.ndarray)
        for key in s.columns.values:
            k2 = "_".join(key)
            assert isinstance(ds.data[k2], np.ndarray)
            assert list(s[key]) == list(ds.data[k2])

    def test_data_accepts_groupby_with_None_subindex_name(self) -> None:
        df = pd.DataFrame({"A": [1, 2, 3, 4] * 2, "B": [10, 20, 30, 40] * 2, "C": range(8)})
        group = df.groupby(['A', [10, 20, 30, 40] * 2])
        ds = bms.ColumnDataSource()
        assert ds.data == {}
        ds.data = group
        s = group.describe()
        assert len(ds.column_names) == 17
        assert ds.length == 4
        assert isinstance(ds.data['index'], np.ndarray)
        for key in s.columns.values:
            k2 = "_".join(key)
            assert isinstance(ds.data[k2], np.ndarray)
            assert list(s[key]) == list(ds.data[k2])

    def test__stream_good_df_with_date_index_data(self) -> None:
        df = pd.DataFrame(
            index=pd.date_range('now', periods=30, freq='min'),
            columns=['A'],
            data=np.cumsum(np.random.standard_normal(30), axis=0),
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
            data=np.random.standard_normal(30),
        )
        ds._stream(new_df, "foo", mock_setter)
        assert np.array_equal(stuff['args'][2]['index'], new_df.index.values)
        assert np.array_equal(stuff['args'][2]['A'], new_df.A.values)

    def test__stream_good_dict_of_index_and_series_data(self) -> None:
        df = pd.DataFrame(
            index=pd.date_range('now', periods=30, freq='min'),
            columns=['A'],
            data=np.cumsum(np.random.standard_normal(30), axis=0),
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
            data=np.random.standard_normal(30),
        )
        ds._stream({'index': new_df.index, 'A': new_df.A}, "foo", mock_setter)
        assert np.array_equal(stuff['args'][2]['index'], new_df.index.values)
        assert np.array_equal(stuff['args'][2]['A'], new_df.A.values)

    def test__stream_good_dict_of_index_and_series_data_transformed(self) -> None:
        df = pd.DataFrame(
            index=pd.date_range('now', periods=30, freq='min'),
            columns=['A'],
            data=np.cumsum(np.random.standard_normal(30), axis=0),
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
            data=np.random.standard_normal(30),
        )
        ds._stream({'index': new_df.index, 'A': new_df.A}, "foo", mock_setter)
        assert np.array_equal(stuff['args'][2]['index'], convert_datetime_array(new_df.index.values))
        assert np.array_equal(stuff['args'][2]['A'], new_df.A.values)

    def _assert_equal_dicts_of_arrays(self, d1, d2):
        assert d1.keys() == d2.keys()
        for k, v in d1.items():
            assert type(v) is np.ndarray
            assert np.array_equal(v, d2[k])

    def test_stream_dict_to_ds_created_from_df(self) -> None:
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

        assert notify_owners_stuff['args'] == (Undefined,)

        self._assert_equal_dicts_of_arrays(dict(ds.data),
                                           dict(a=np.array([10, 11, 12]),
                                                b=np.array([20, 21, 22]),
                                                c=np.array([30, 31, 32])))

    def test_stream_series_to_ds_created_from_df(self) -> None:
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

        assert notify_owners_stuff['args'] == (Undefined,)

        self._assert_equal_dicts_of_arrays(dict(ds.data),
                                           dict(a=np.array([10, 11]),
                                                b=np.array([20, 21]),
                                                c=np.array([30, 31]),
                                                index=np.array([0, 0])))

    def test_stream_df_to_ds_created_from_df_named_index(self) -> None:
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

        assert notify_owners_stuff['args'] == (Undefined,)

        self._assert_equal_dicts_of_arrays(dict(ds.data),
                                           dict(a=np.array([10, 11, 12]),
                                                b=np.array([20, 21, 22]),
                                                c=np.array([30, 31, 32])))

    def test_stream_df_to_ds_created_from_df_default_index(self) -> None:
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

        assert notify_owners_stuff['args'] == (Undefined,)

        self._assert_equal_dicts_of_arrays(dict(ds.data),
                                           dict(a=np.array([10, 11, 12]),
                                                b=np.array([20, 21, 22]),
                                                c=np.array([30, 31, 32]),
                                                index=np.array([0, 0, 1])))

    def test__df_index_name_with_named_index(self) -> None:
        df = pd.DataFrame(dict(a=[10], b=[20], c=[30])).set_index('c')
        assert bms.ColumnDataSource._df_index_name(df) == "c"

    def test__df_index_name_with_unnamed_index(self) -> None:
        df = pd.DataFrame(dict(a=[10], b=[20], c=[30]))
        assert bms.ColumnDataSource._df_index_name(df) == "index"

    def test__df_index_name_with_named_multi_index(self) -> None:
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

    def test__df_index_name_with_unnamed_multi_index(self) -> None:
        arrays = [np.array(['bar', 'bar', 'baz', 'baz', 'foo', 'foo', 'qux', 'qux']),
                  np.array(['one', 'two', 'one', 'two', 'one', 'two', 'one', 'two'])]
        df = pd.DataFrame(np.random.randn(8, 4), index=arrays)
        assert df.index.names == [None, None]
        assert bms.ColumnDataSource._df_index_name(df) == "index"


class TestDataTable:
    def test_from_data_with_dataframe(self):
        pd = pytest.importorskip("pandas")
        df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
        table = DataTable.from_data(df)
        assert isinstance(table, DataTable)
        assert set(table.source.data) - {"index"} == {'A', 'B'}

    def test_from_data_with_dict(self):
        data = {'A': [1, 2, 3], 'B': [4, 5, 6]}
        table = DataTable.from_data(data)
        assert isinstance(table, DataTable)
        assert set(table.source.data) == {'A', 'B'}

    def test_from_data_with_columndatasource(self):
        source = ColumnDataSource({'A': [1, 2, 3], 'B': [4, 5, 6]})
        table = DataTable.from_data(source)
        assert isinstance(table, DataTable)
        assert set(table.source.data) == {'A', 'B'}
        assert source is not table.source

    @pytest.mark.parametrize("typ", (dict, *((pd.DataFrame,) if pd else ()), ColumnDataSource))
    def test_from_data_with_columns(self, typ):
        data = typ({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})
        table = DataTable.from_data(data, columns=['A', 'B'])
        assert isinstance(table, DataTable)
        assert set(table.source.data) == {'A', 'B'}

    def test_from_data_with_formatters(self):
        formatter = NumberFormatter(format="0.00")
        table = DataTable.from_data({'A': [1], 'B': [2]}, formatters={'A': formatter})

        columns = {column.field: column for column in table.columns}
        assert columns['A'].formatter is formatter
        assert 'formatter' not in columns['B']._property_values

    def test_from_data_with_invalid_data(self):
        with pytest.raises(ValueError, match="Expected a ColumnDataSource or something a ColumnDataSource can be created from like a dict or a DataFrame"):
            DataTable.from_data("invalid data")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------


class GraphTestIndexedSource(bms.IndexedDataSource):
    pass


class TestGraphDataSource:
    def test_default_sources_define_topology_fields(self) -> None:
        source = bms.GraphDataSource()

        assert source.nodes.data == dict(index=[])
        assert source.edges.data == dict(start=[], end=[])

    @pytest.mark.parametrize("empty", [[], {}])
    def test_explicit_empty_data_defines_topology_fields(self, empty) -> None:
        source = bms.GraphDataSource(nodes=empty, edges=empty)

        assert source.nodes.data == dict(index=[])
        assert source.edges.data == dict(start=[], end=[])

    def test_accepts_node_identifier_mapping(self) -> None:
        source = bms.GraphDataSource(nodes={"alice": {"color": "red"}, "bob": {"color": "blue"}})

        assert source.nodes.data == dict(index=["alice", "bob"], color=["red", "blue"])

    def test_accepts_storage_neutral_child_sources(self) -> None:
        nodes = GraphTestIndexedSource()
        edges = GraphTestIndexedSource()
        source = bms.GraphDataSource(nodes=nodes, edges=edges)

        assert source.nodes is nodes
        assert source.edges is edges

    def test_accepts_graph_shaped_records(self) -> None:
        source = bms.GraphDataSource(
            nodes=[{"id": "alice", "color": "red"}, {"id": "bob", "color": "blue"}],
            edges=[{"source": "alice", "target": "bob", "weight": 2}],
        )

        assert source.nodes.data == dict(index=["alice", "bob"], color=["red", "blue"])
        assert source.edges.data == dict(start=["alice"], end=["bob"], weight=[2])

    def test_preserves_alias_named_attributes_in_graph_records(self) -> None:
        source = bms.GraphDataSource(
            nodes=[{"index": "A", "id": "station-1"}, {"index": "B", "id": "station-2"}],
            edges=[{"start": "A", "end": "B", "source": "survey"}],
        )

        assert source.nodes.data == dict(index=["A", "B"], id=["station-1", "station-2"])
        assert source.edges.data == dict(start=["A"], end=["B"], source=["survey"])

    def test_accepts_bare_nodes_and_tuple_edges(self) -> None:
        source = bms.GraphDataSource(nodes=["alice", "bob"], edges=[("alice", "bob", {"weight": 2})])

        assert source.nodes.data == dict(index=["alice", "bob"])
        assert source.edges.data == dict(start=["alice"], end=["bob"], weight=[2])

    def test_accepts_composite_node_ids_and_list_edges(self) -> None:
        source = bms.GraphDataSource(
            nodes=[((1, 2), {"label": "A"}), ((3, 4), {"label": "B"})],
            edges=[[(1, 2), (3, 4), {"weight": 2}]],
        )

        assert source.nodes.data == dict(index=[[1, 2], [3, 4]], label=["A", "B"])
        assert source.edges.data == dict(start=[[1, 2]], end=[[3, 4]], weight=[2])

    def test_rejects_duplicate_node_ids(self) -> None:
        with pytest.raises(ValueError, match="duplicate graph node identifier"):
            bms.GraphDataSource(nodes=["alice", "alice"])

    @pytest.mark.parametrize("nodes", [
        {"alice": {"index": "bob"}},
        [("alice", {"index": "bob"})],
    ])
    def test_rejects_node_attributes_that_overwrite_identifiers(self, nodes) -> None:
        with pytest.raises(ValueError, match="reserved 'index' field"):
            bms.GraphDataSource(nodes=nodes)

    def test_rejects_node_records_without_identifiers(self) -> None:
        with pytest.raises(ValueError, match="must contain an 'id' or 'index'"):
            bms.GraphDataSource(nodes=[{"label": "Alice"}])

    @pytest.mark.parametrize("edge", [{"source": "alice"}, {"target": "bob"}])
    def test_rejects_edge_records_with_missing_endpoints(self, edge) -> None:
        with pytest.raises(ValueError, match="must contain source/target or start/end"):
            bms.GraphDataSource(edges=[edge])

    def test_rejects_edge_tuple_attributes_that_are_not_mappings(self) -> None:
        with pytest.raises(ValueError, match="third item of an edge tuple must be an attribute mapping"):
            bms.GraphDataSource(edges=[("alice", "bob", "label")])

    @pytest.mark.parametrize("endpoint", ["start", "end"])
    def test_rejects_edge_attributes_that_overwrite_endpoints(self, endpoint: str) -> None:
        with pytest.raises(ValueError, match="edge tuple attributes cannot contain endpoint fields"):
            bms.GraphDataSource(edges=[("alice", "bob", {endpoint: "carol"})])

    @pytest.mark.parametrize("edge", [("alice",), ("alice", "bob", {}, {}), 1])
    def test_rejects_malformed_edges(self, edge) -> None:
        with pytest.raises(ValueError, match="an edge must be a mapping or a"):
            bms.GraphDataSource(edges=[edge])

    def test_rejects_multiple_positional_graphs(self) -> None:
        with pytest.raises(TypeError, match="at most one positional graph argument"):
            bms.GraphDataSource(object(), object())

    def test_rejects_duplicate_graph_arguments(self) -> None:
        with pytest.raises(TypeError, match="graph was provided more than once"):
            bms.GraphDataSource(object(), graph=object())

    @pytest.mark.parametrize("table", ["nodes", "edges"])
    def test_rejects_graph_with_explicit_tables(self, table: str) -> None:
        with pytest.raises(ValueError, match="provide either a graph or explicit nodes and edges"):
            bms.GraphDataSource(graph=object(), **{table: []})

    def test_rejects_objects_without_a_graph_interface(self) -> None:
        with pytest.raises(ValueError, match="expected a NetworkX-like graph"):
            bms.GraphDataSource(object())

    def test_distinguishes_scalar_identifier_types(self) -> None:
        identifiers = [None, False, 0, -0.0, True, 1, "1"]
        source = bms.GraphDataSource(nodes=identifiers)

        assert source.nodes.data["index"] == identifiers

    @pytest.mark.parametrize("identifiers", [
        [np.int64(1), 1],
        [np.bool_(True), True],
        [np.float32(np.nan), float("nan")],
    ])
    def test_rejects_identifiers_that_serialize_to_the_same_scalar(self, identifiers) -> None:
        with pytest.raises(ValueError, match="duplicate graph node identifier"):
            bms.GraphDataSource(nodes=identifiers)

    @pytest.mark.skipif(pd is None, reason="requires pandas")
    def test_rejects_duplicate_null_identifiers(self) -> None:
        with pytest.raises(ValueError, match="duplicate graph node identifier"):
            bms.GraphDataSource(nodes=[pd.NA, None])

    def test_rejects_non_scalar_identifiers(self) -> None:
        with pytest.raises(ValueError, match="identifiers must be scalar values or nested sequences"):
            bms.GraphDataSource(nodes=[{"id": object()}])

    def test_accepts_networkx_like_graphs_directly(self) -> None:
        class Graph:
            def nodes(self, *, data):
                assert data is True
                return [("alice", {"color": "red"}), ("bob", {"color": "blue"})]

            def edges(self, *, data):
                assert data is True
                return [("alice", "bob", {"weight": 2})]

        source = bms.GraphDataSource(Graph())

        assert source.nodes.data == dict(index=["alice", "bob"], color=["red", "blue"])
        assert source.edges.data == dict(start=["alice"], end=["bob"], weight=[2])

    def test_preserves_non_internal_networkx_attributes(self) -> None:
        class Graph:
            def nodes(self, *, data):
                assert data is True
                return [("alice", {"id": "external"})]

            def edges(self, *, data):
                assert data is True
                return [("alice", "alice", {"source": "imported", "target": "value"})]

        source = bms.GraphDataSource(Graph())

        assert source.nodes.data == dict(index=["alice"], id=["external"])
        assert source.edges.data == dict(
            start=["alice"], end=["alice"], source=["imported"], target=["value"],
        )

    @pytest.mark.skipif(pd is None, reason="requires pandas")
    def test_normalizes_dataframe_topology_aliases(self) -> None:
        source = bms.GraphDataSource(
            nodes=pd.DataFrame({"id": ["alice", "bob"], "color": ["red", "blue"]}),
            edges=pd.DataFrame({"source": ["alice"], "target": ["bob"], "weight": [2]}),
        )

        assert list(source.nodes.data["index"]) == ["alice", "bob"]
        assert list(source.nodes.data["color"]) == ["red", "blue"]
        assert list(source.edges.data["start"]) == ["alice"]
        assert list(source.edges.data["end"]) == ["bob"]
        assert "level_0" not in source.nodes.data
        assert list(source.edges.data["index"]) == [0]

    def test_accepts_identifiers_serialized_as_browser_scalars(self) -> None:
        nodes = [dt.date(2024, 1, 1), np.datetime64("2024-01-02T00:00:00"), np.timedelta64(2, "D")]
        source = bms.GraphDataSource(nodes=nodes)

        assert source.nodes.data["index"] == nodes
        document = Document()
        document.add_root(source)
        assert document.to_json()

    def test_child_updates_use_normal_document_events(self) -> None:
        source = bms.GraphDataSource(nodes=["alice", "bob"], edges=[("alice", "bob")])
        document = Document()
        document.add_root(source)
        events = []
        document.on_change(events.append)

        assert isinstance(source.nodes, ColumnDataSource)
        source.nodes.data = {"index": ["alice", "bob", "carol"]}

        assert len(events) == 1
        assert isinstance(events[0], ColumnDataChangedEvent)
        assert events[0].model is source.nodes
