#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from dataclasses import asdict, dataclass
from pathlib import Path

# External imports
import narwhals.stable.v1 as nw
import numpy as np

# Bokeh imports
from bokeh.document import Document
from bokeh.document.events import ColumnDataChangedEvent, ColumnsPatchedEvent, ColumnsStreamedEvent
from bokeh.models import (
    ColumnDataSource,
    DataTable,
    NumberFormatter,
    Selection,
    SelectionPolicy,
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

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class RecordDataSource(bms.IndexedDataSource):
    pass

class TestDataSource:
    def test_selection_state_belongs_to_indexed_sources(self) -> None:
        ds = RecordDataSource()
        assert isinstance(ds.selected, Selection)
        assert isinstance(ds.selection_policy, SelectionPolicy)
        assert ds.selection_policy.combine == "union"

        ds.selection_policy = SelectionPolicy(combine="intersection")
        assert ds.selection_policy.combine == "intersection"

    def test_base_source_has_no_record_axis(self) -> None:
        class CompositeDataSource(bms.DataSource):
            pass

        assert "selected" not in CompositeDataSource.properties()
        assert "selection_policy" not in CompositeDataSource.properties()

class TestMeshDataSource:
    def test_default_sources_define_coordinate_and_connectivity_fields(self) -> None:
        source = bms.MeshDataSource()

        assert source.vertices.data == dict(x=[], y=[])
        assert source.cells.data == dict(vertices=[])
        assert source.selected is source.cells.selected
        assert source.selection_policy is source.cells.selection_policy
        assert source.length == 0

    def test_accepts_explicit_empty_data_and_custom_connectivity_field(self) -> None:
        source = bms.MeshDataSource(vertices=[], cells=[], connectivity_field="faces")

        assert source.vertices.data == dict(x=[], y=[])
        assert source.cells.data == dict(faces=[])

        single = bms.MeshDataSource(vertices=[[0, 0], [1, 0], [0, 1]], cells=[0, 1, 2])
        assert single.cells.data == dict(vertices=[[0, 1, 2]])

    def test_accepts_dense_vertices_and_connectivity(self) -> None:
        source = bms.MeshDataSource(
            vertices=np.array([[0, 0], [2, 0], [1, 1]], dtype=np.float32),
            cells=np.array([[0, 1, 2]], dtype=np.int32),
        )

        assert np.array_equal(source.vertices.data["x"], [0, 2, 1])
        assert np.array_equal(source.vertices.data["y"], [0, 0, 1])
        assert np.array_equal(source.cells.data["vertices"], [[0, 1, 2]])
        assert source.length == 1

    def test_accepts_ragged_cells_and_cell_attributes(self) -> None:
        source = bms.MeshDataSource(
            vertices={"x": [0, 1, 1, 0], "y": [0, 0, 1, 1]},
            cells={"vertices": [[0, 1, 2], [0, 2, 3]], "value": [10, 20]},
        )

        assert source.cells.data == {
            "vertices": [[0, 1, 2], [0, 2, 3]],
            "value": [10, 20],
        }
        assert source.length == 2

    def test_accepts_storage_neutral_child_sources(self) -> None:
        vertices = RecordDataSource()
        cells = RecordDataSource()
        source = bms.MeshDataSource(vertices=vertices, cells=cells)

        assert source.vertices is vertices
        assert source.cells is cells

    def test_rejects_invalid_connectivity(self) -> None:
        with pytest.raises(ValueError, match="indices must be integers"):
            bms.MeshDataSource(vertices=[[0, 0]], cells=[[0.5]])

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
        nodes = RecordDataSource()
        edges = RecordDataSource()
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
        assert "index" not in source.edges.data

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

class TestGeometryDataSource:
    def test_accepts_geo_interface_and_crs(self) -> None:
        class GeoFrame:
            crs = "EPSG:4326"
            __geo_interface__ = {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [1, 2]},
                    "properties": {"name": "A"},
                }],
            }

        source = bms.GeometryDataSource(GeoFrame())

        assert source.geometries == [{"type": "Point", "coordinates": [1, 2]}]
        assert source.data == {"name": ["A"]}
        assert source.crs == "EPSG:4326"

    def test_accepts_feature_collection_and_retains_geometry(self) -> None:
        source = bms.GeometryDataSource({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [[0, 0], [4, 0], [4, 4], [0, 0]],
                        [[1, 1], [2, 1], [1, 2], [1, 1]],
                    ],
                },
                "properties": {"name": "with a hole"},
            }],
        })

        assert source.length == 1
        assert source.geometries[0]["type"] == "Polygon"
        assert len(source.geometries[0]["coordinates"]) == 2
        assert source.data == {"name": ["with a hole"]}
        assert source.column_names == ["geometry", "name"]

    def test_accepts_geometry_records(self) -> None:
        source = bms.GeometryDataSource([
            {"geometry": {"type": "Point", "coordinates": [1, 2]}, "name": "A", "type": "city"},
            {"geometry": {"type": "Point", "coordinates": [3, 4]}, "name": "B", "type": "town"},
        ])

        assert source.geometries == [
            {"type": "Point", "coordinates": [1, 2]},
            {"type": "Point", "coordinates": [3, 4]},
        ]
        assert source.data == {"name": ["A", "B"], "type": ["city", "town"]}

    def test_normalizes_numpy_geometry_coordinates(self) -> None:
        source = bms.GeometryDataSource({
            "type": "Polygon",
            "coordinates": [np.array([[0, 0], [2, 0], [0, 0]])],
        })

        assert source.geometries == [{
            "type": "Polygon",
            "coordinates": [[[0, 0], [2, 0], [0, 0]]],
        }]

    def test_from_xy_accepts_nested_and_nan_separated_coordinates(self) -> None:
        source = bms.GeometryDataSource.from_xy(
            [[0, 1, 0], [2, 3, np.nan, 4, 5]],
            [[0, 0, 0], [2, 2, np.nan, 4, 4]],
            data={"name": ["single", "parts"]},
        )

        assert [geometry["type"] for geometry in source.geometries] == ["Polygon", "MultiPolygon"]
        assert source.data == {"name": ["single", "parts"]}

    def test_flattens_nested_geometry_collections_to_selectable_features(self) -> None:
        source = bms.GeometryDataSource({
            "type": "Feature",
            "properties": {"group": "A"},
            "geometry": {
                "type": "GeometryCollection",
                "geometries": [
                    {"type": "Point", "coordinates": [1, 2]},
                    {"type": "LineString", "coordinates": [[0, 0], [1, 1]]},
                ],
            },
        })

        assert [geometry["type"] for geometry in source.geometries] == ["Point", "LineString"]
        assert source.data == {"group": ["A", "A"]}

    def test_rejects_misaligned_attribute_columns(self) -> None:
        with pytest.raises(ValueError, match="same length as geometries"):
            bms.GeometryDataSource(
                geometries=[{"type": "Point", "coordinates": [1, 2]}],
                data={"name": ["A", "B"]},
            )

    def test_streams_geometry_records_with_rollover(self) -> None:
        source = bms.GeometryDataSource([
            {"geometry": {"type": "Point", "coordinates": [1, 2]}, "name": "A"},
        ])

        source.stream([
            {"geometry": {"type": "Point", "coordinates": [3, 4]}, "name": "B"},
            {"geometry": {"type": "Point", "coordinates": [5, 6]}, "name": "C"},
        ], rollover=2)

        assert [geometry["coordinates"] for geometry in source.geometries] == [[3, 4], [5, 6]]
        assert source.data == {"name": ["B", "C"]}

    def test_stream_preserves_setter_for_server_synchronization(self) -> None:
        source = bms.GeometryDataSource([
            {"geometry": {"type": "Point", "coordinates": [1, 2]}, "name": "A"},
        ])
        document = Document()
        document.add_root(source)
        events = []
        document.on_change(events.append)

        source.stream([
            {"geometry": {"type": "Point", "coordinates": [3, 4]}, "name": "B"},
        ], setter="session")

        assert len(events) == 1
        assert isinstance(events[0], ColumnsStreamedEvent)
        assert events[0].attr == "records"
        assert events[0].setter == "session"

    def test_stream_backfills_new_attributes(self) -> None:
        source = bms.GeometryDataSource([
            {"geometry": {"type": "Point", "coordinates": [1, 2]}, "name": "A"},
        ])

        source.stream([
            {"geometry": {"type": "Point", "coordinates": [3, 4]}, "name": "B", "kind": "city"},
        ])

        assert source.data == {"name": ["A", "B"], "kind": [None, "city"]}

    def test_patches_geometry_and_attributes(self) -> None:
        source = bms.GeometryDataSource([
            {"geometry": {"type": "Point", "coordinates": [1, 2]}, "name": "A"},
        ])

        source.patch({
            "geometry": [(0, {"type": "Point", "coordinates": [3, 4]})],
            "name": [(0, "B")],
        })

        assert source.geometries == [{"type": "Point", "coordinates": [3, 4]}]
        assert source.data == {"name": ["B"]}

    def test_patch_uses_one_composite_document_event(self) -> None:
        source = bms.GeometryDataSource([
            {"geometry": {"type": "Point", "coordinates": [1, 2]}, "name": "A"},
        ])
        document = Document()
        document.add_root(source)
        events = []
        document.on_change(events.append)

        source.patch({
            "geometry": [(0, {"type": "Point", "coordinates": [3, 4]})],
            "name": [(0, "B")],
        })

        assert len(events) == 1
        assert isinstance(events[0], ColumnsPatchedEvent)
        assert events[0].attr == "records"

    def test_stream_requires_aligned_attributes(self) -> None:
        source = bms.GeometryDataSource([
            {"geometry": {"type": "Point", "coordinates": [1, 2]}, "name": "A"},
        ])

        with pytest.raises(ValueError, match="missing: name"):
            source.stream([{"type": "Point", "coordinates": [3, 4]}])

class TestGeometryDataSourceReplacement:
    def test_replace_accepts_geojson_strings(self) -> None:
        source = bms.GeometryDataSource('''{
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [1, 2]},
                "properties": {"name": "A"}
            }]
        }''')

        assert source.geometries == [{"type": "Point", "coordinates": [1, 2]}]
        assert source.data == {"name": ["A"]}

        source.replace('{"type": "Point", "coordinates": [3, 4]}')

        assert source.geometries == [{"type": "Point", "coordinates": [3, 4]}]
        assert source.data == {}

    def test_replace_uses_one_composite_document_event(self) -> None:
        source = bms.GeometryDataSource({"type": "Point", "coordinates": [1, 2]})
        document = Document()
        document.add_root(source)
        events = []
        document.on_change(events.append)

        source.replace({"type": "Point", "coordinates": [3, 4]})

        assert len(events) == 1
        assert isinstance(events[0], ColumnDataChangedEvent)
        assert events[0].attr == "records"

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
        with pytest.raises(ValueError, match=r"Can only sub-patch into columns with NumPy array items"):
            ds.patch(dict(foo=[[[0, 3], 5]]))
        with pytest.raises(ValueError, match=r"Invalid patch index: {}"):
            ds.patch(dict(foo=[[{}, 5]]))

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

        assert notify_owners_stuff['args'] == (OldValueUnavailable,)

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

        assert notify_owners_stuff['args'] == (OldValueUnavailable,)

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

        assert notify_owners_stuff['args'] == (OldValueUnavailable,)

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

        assert notify_owners_stuff['args'] == (OldValueUnavailable,)

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
