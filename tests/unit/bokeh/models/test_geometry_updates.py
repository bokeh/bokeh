from __future__ import annotations

import numpy as np
import pytest

from bokeh.core.serialization import Serializer
from bokeh.document import Document
from bokeh.document.events import (
    ColumnDataChangedEvent,
    ColumnsPatchedEvent,
    ColumnsStreamedEvent,
    ModelChangedEvent,
)
from bokeh.geometry import line_string, point, polygon
from bokeh.model import Debounce, Throttle
from bokeh.models import (
    ColumnDataSource,
    GeometryDataSource,
    Range1d,
    RecordDataSource,
    sources as bms,
)
from bokeh.protocol import apply_patch, patch_doc
from bokeh.util.callback_manager import OldValueUnavailable

POINT_FEATURE_COLLECTION_JSON = '''{
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [1, 2]},
                "properties": {"name": "A"}
            }]
        }'''


@pytest.fixture
def model_attribute_source():
    data = GeometryDataSource(geometries=[None], data={"objects": [None]})
    reference = Range1d(name="shared")
    document = Document()
    document.add_root(data)
    document.add_root(reference)
    events = []
    document.on_change(events.append)
    return data, reference, events


def test_record_replacement_snapshot_preserves_model_references(model_attribute_source):
    data, reference, events = model_attribute_source
    records = {"geometries": [None], "data": {"objects": [reference]}}
    data.replace(records)
    assert data.data["objects"][0] is reference
    assert len(events) == 1
    assert events[0].data["data"]["objects"][0] is reference
    assert events[0].to_serializable(Serializer(references={data, reference}))["data"] == Serializer(references={reference}).encode(records)


def test_stream_snapshot_preserves_model_references(model_attribute_source):
    data, reference, events = model_attribute_source
    records = {"geometries": [None], "data": {"objects": [reference]}}
    data.stream(records)
    assert data.data["objects"][1] is reference
    assert len(events) == 1
    assert events[0].data["data"]["objects"][0] is reference
    assert events[0].to_serializable(Serializer(references={data, reference}))["data"] == Serializer(references={reference}).encode(records)


def test_patch_snapshot_preserves_model_references(model_attribute_source):
    data, reference, events = model_attribute_source
    patches = {"objects": [(0, reference)]}
    data.patch(patches)
    assert data.data["objects"][0] is reference
    assert len(events) == 1
    assert events[0].patches["objects"][0][1] is reference
    assert events[0].to_serializable(Serializer(references={data, reference}))["patches"] == Serializer(references={reference}).encode(patches)


def test_attribute_assignment_snapshot_preserves_model_references(model_attribute_source):
    data, reference, events = model_attribute_source
    data.data = {"objects": [reference]}
    assert data.data["objects"][0] is reference
    assert len(events) == 1
    assert events[0].data["objects"][0] is reference
    assert events[0].to_serializable(Serializer(references={data, reference}))["data"] == Serializer(references={reference}).encode({"objects": [reference]})


def test_attribute_column_update_snapshot_preserves_model_references(model_attribute_source):
    data, reference, events = model_attribute_source
    data.data["objects"] = [reference]
    assert data.data["objects"][0] is reference
    assert len(events) == 1
    assert events[0].data["objects"][0] is reference
    assert events[0].to_serializable(Serializer(references={data, reference}))["data"] == Serializer(references={reference}).encode({"objects": [reference]})


def test_attribute_column_update_snapshots_only_changed_columns():
    values = np.arange(8).reshape(1, 8)
    data = GeometryDataSource(geometries=[None], data={"large": values, "v": [1.]})
    document = Document()
    document.add_root(data)
    events = []
    document.on_change(events.append)
    replacement = np.array([2.])
    data.data["v"] = replacement
    assignment_events = len(events)
    event = events[0]
    data.patch({"v": [(0, 9.)]})

    assert assignment_events == 1
    assert event.cols == ["v"]
    assert set(event.data) == {"v"}
    assert event.data["v"] is not replacement
    assert data.data["v"] is replacement
    assert data.data["large"] is values
    np.testing.assert_array_equal(event.data["v"], [2.])
    np.testing.assert_array_equal(replacement, [9.])


def test_object_array_patch_snapshot_preserves_model_references():
    first, second = Range1d(), Range1d()
    values = np.empty((2, 1), dtype=object)
    values[:, 0] = [first, second]
    data = GeometryDataSource(geometries=[None, None], data={"objects": values})
    document = Document()
    for model in (data, first, second):
        document.add_root(model)
    events = []
    document.on_change(events.append)
    data.patch({"objects": [(0, values[1])]})
    data.patch({"objects": [(1, [first])]})
    assert data.data["objects"] is values
    assert values[0, 0] is second
    assert values[1, 0] is first
    assert len(events) == 2
    assert events[0].patches["objects"][0][1][0] is second
    expected = {"objects": [(0, np.array([second], dtype=object))]}
    assert events[0].to_serializable(Serializer(references={data, first, second}))["patches"] == Serializer(references={first, second}).encode(expected)


def source():
    return bms.GeometryDataSource(geometries=[polygon([[[0, 0], [1, 0], [0, 1]]])])


@pytest.mark.parametrize("operation", ["replace", "stream"])
@pytest.mark.parametrize("column", ["x", {"a": 1}, {1}])
def test_malformed_record_columns_are_rejected_atomically(operation, column):
    data = GeometryDataSource(geometries=[None], data={"v": [0]})
    document = Document()
    document.add_root(data)
    geometries, attributes = data.geometries, data.data
    events, calls = [], []
    document.on_change(events.append)
    data.on_change("geometries", lambda attr, old, new: calls.append(attr))
    data.on_change("data", lambda attr, old, new: calls.append(attr))
    with pytest.raises(ValueError):
        getattr(data, operation)({"geometries": [point([2, 3])], "data": {"v": column}})
    assert data.geometries is geometries
    assert data.data is attributes
    assert data.geometries == [None]
    assert data.data == {"v": [0]}
    assert events == []
    assert calls == []


def test_record_event_handlers_allow_omitted_cols_and_rollover():
    data = source()
    document = Document()
    document.add_root(data)
    ColumnDataChangedEvent._handle_json(document, None, {
        "model": data, "attr": "records", "data": {"geometries": [None, None], "data": {"name": ["a", "b"]}},
    })
    replaced_geometries, replaced_data = data.geometries, data.data
    ColumnsStreamedEvent._handle_json(document, None, {
        "model": data, "attr": "records", "data": {"geometries": [], "data": {"w": []}},
    })
    assert data.geometries == [None, None]
    assert replaced_geometries == [None, None]
    assert replaced_data == {"name": ["a", "b"]}
    assert data.data == {"name": ["a", "b"], "w": [None, None]}


@pytest.mark.parametrize("event_type", [ColumnDataChangedEvent, ColumnsStreamedEvent, ColumnsPatchedEvent])
def test_geometry_record_protocol_rejects_column_data_sources(event_type):
    data = ColumnDataSource(data={"v": [1]})
    document = Document()
    document.add_root(data)
    event = event_type(document, data, "records", {"v": [2]})
    with pytest.raises(RuntimeError, match="replaceable data source"):
        apply_patch(patch_doc([event]), document)
    assert data.data == {"v": [1]}


@pytest.mark.parametrize("event_type", [ColumnDataChangedEvent, ColumnsStreamedEvent, ColumnsPatchedEvent])
def test_geometry_record_protocol_rejects_record_data_sources(event_type):
    data = RecordDataSource(records=[{"v": 1}])
    document = Document()
    document.add_root(data)
    event = event_type(document, data, "records", {"v": [2]})
    with pytest.raises(RuntimeError, match="replaceable data source"):
        apply_patch(patch_doc([event]), document)
    assert data.records == [{"v": 1}]


def test_record_source_property_updates_still_combine_during_a_hold():
    source = RecordDataSource(records=[{"v": 1}])
    document = Document()
    document.add_root(source)
    receiver = Document.from_json(document.to_json())
    events, callbacks = [], []
    document.on_change(events.append)
    source.on_change("records", lambda attr, old, new: callbacks.append(new))
    document.hold("combine")
    source.records = [{"v": 2}]
    source.name = "updated"
    source.records = [{"v": 3}]
    document.unhold()
    apply_patch(patch_doc(events), receiver)

    assert len(events) == 2
    assert [event.attr for event in events] == ["records", "name"]
    assert callbacks == [[{"v": 3}]]
    assert receiver.roots[0].records == [{"v": 3}]
    assert receiver.roots[0].name == "updated"


@pytest.mark.parametrize("rollover", [np.int32(0), np.int64(1), np.uint64(2)])
def test_numpy_rollover_survives_json_transport(rollover):
    import json

    data = GeometryDataSource(geometries=[None], data={"v": [0]})
    document = Document()
    document.add_root(data)
    receiver = Document.from_json(document.to_json())
    events = []
    document.on_change(events.append)
    data.stream({"geometries": [None], "data": {"v": [1]}}, rollover=rollover)
    message = patch_doc(events)
    envelope = json.loads(message.envelope_json)
    rollover_type = type(envelope["content"]["events"][0]["rollover"])
    receiver.apply_json_patch(envelope["content"])

    assert rollover_type is int
    assert receiver.roots[0].data == data.data
    assert receiver.roots[0].geometries == data.geometries


def test_geometry_protocol_rejects_columnar_streams():
    source = GeometryDataSource(geometries=[None], data={"v": [0]})
    document = Document()
    document.add_root(source)
    event = ColumnsStreamedEvent(document, source, "data", {"v": [1]})
    with pytest.raises(RuntimeError, match="replaceable data source streams require the records attribute"):
        apply_patch(patch_doc([event]), document)
    assert source.geometries == [None]
    assert source.data == {"v": [0]}


def test_geometry_protocol_rejects_columnar_patches():
    source = GeometryDataSource(geometries=[None], data={"v": [0]})
    document = Document()
    document.add_root(source)
    event = ColumnsPatchedEvent(document, source, "data", {"v": [(0, 1)]})
    with pytest.raises(RuntimeError, match="replaceable data source patches require the records attribute"):
        apply_patch(patch_doc([event]), document)
    assert source.geometries == [None]
    assert source.data == {"v": [0]}


def test_stream_retains_existing_geometry_storage_and_normalizes_new_features():
    source = GeometryDataSource(line_string([[i, i] for i in range(100_000)]))
    geometry = source.geometries[0]
    coordinates = geometry["coordinates"]
    incoming = point([1, 2, 3])
    source.stream({"geometries": [incoming, incoming], "data": {}}, rollover=3)
    assert source.geometries[0] is geometry
    assert source.geometries[0]["coordinates"] is coordinates
    assert source.geometries[1] is not incoming
    assert source.geometries[1] is not source.geometries[2]
    assert source.geometries[1:] == [
        {"type": "Point", "coordinates": [1, 2, 3]},
        {"type": "Point", "coordinates": [1, 2, 3]},
    ]


def test_replace_refreshes_callback_policy_baselines():
    source = GeometryDataSource(geometries=[None], data={"v": [0]})
    document = Document()
    document.add_root(source)
    calls = []
    source.on_change("geometries", lambda name, old, new: calls.append((old, new)), policy=Throttle(100))
    records = {"geometries": [point([1, 2])], "data": {"v": [1]}}
    source.replace(records)
    observed = source.geometries
    new = [None]
    event = ModelChangedEvent(document, source, "geometries", new, callback_policy=("throttle", 100))
    apply_patch(patch_doc([event]), document, setter="client")
    assert len(calls) == 2
    assert calls[-1] == (observed, new)


def test_stream_refreshes_callback_policy_baselines():
    source = GeometryDataSource(geometries=[None], data={"v": [0]})
    document = Document()
    document.add_root(source)
    calls = []
    source.on_change("geometries", lambda name, old, new: calls.append((old, new)), policy=Throttle(100))
    records = {"geometries": [point([1, 2])], "data": {"v": [1]}}
    source.stream(records, rollover=1)
    observed = source.geometries
    new = [None]
    event = ModelChangedEvent(document, source, "geometries", new, callback_policy=("throttle", 100))
    apply_patch(patch_doc([event]), document, setter="client")
    assert len(calls) == 2
    assert calls[-1] == (observed, new)


def test_patch_refreshes_callback_policy_baselines():
    source = GeometryDataSource(geometries=[None], data={"v": [0]})
    document = Document()
    document.add_root(source)
    throttle_calls, debounce_calls = [], []
    source.on_change("geometries", lambda name, old, new: throttle_calls.append((old, new)), policy=Throttle(100))
    source.on_change("geometries", lambda name, old, new: debounce_calls.append((old, new)), policy=Debounce(100))
    first = ModelChangedEvent(document, source, "geometries", [point([1, 2])], callback_policy=("throttle", 100))
    apply_patch(patch_doc([first]), document, setter="client")
    leading_calls = (len(throttle_calls), len(debounce_calls))
    source.patch({"geometry": [(0, point([3, 4]))], "v": [(0, 1)]})
    observed = source.geometries
    new = [None]
    event = ModelChangedEvent(document, source, "geometries", new, callback_policy=("debounce", 100))
    apply_patch(patch_doc([event]), document, setter="client")
    assert leading_calls == (1, 0)
    assert len(throttle_calls) == 2
    assert len(debounce_calls) == 2
    assert debounce_calls[-1] == (observed, new)


@pytest.mark.parametrize("kind, shape", [("Polygon", (1, 4, 2)), ("MultiPolygon", (1, 1, 4, 2))])
def test_preserves_shaped_arrays_on_geometry_assignment(kind, shape):
    source = GeometryDataSource()
    coordinates = np.arange(np.prod(shape), dtype=float).reshape(shape)
    source.geometries = [dict(type=kind, coordinates=coordinates)]
    assert source.geometries[0]["coordinates"] is coordinates
    encoded = Serializer().encode(source.geometries[0]["coordinates"])
    assert encoded["type"] == "ndarray"
    assert encoded["shape"] == list(shape)


class TestGeometryDataSourceUpdates:
    def test_streams_geometry_records_with_rollover(self) -> None:
        source = bms.GeometryDataSource([
            {"geometry": point([1, 2]), "name": "A"},
        ])

        source.stream([
            {"geometry": point([3, 4]), "name": "B"},
            {"geometry": point([5, 6]), "name": "C"},
        ], rollover=2)

        assert [geometry["coordinates"] for geometry in source.geometries] == [[3, 4], [5, 6]]
        assert source.data == {"name": ["B", "C"]}


    def test_stream_preserves_setter_for_server_synchronization(self) -> None:
        source = bms.GeometryDataSource([
            {"geometry": point([1, 2]), "name": "A"},
        ])
        document = Document()
        document.add_root(source)
        events = []
        document.on_change(events.append)

        source.stream([
            {"geometry": point([3, 4]), "name": "B"},
        ], setter="session")

        assert len(events) == 1
        assert isinstance(events[0], ColumnsStreamedEvent)
        assert events[0].attr == "records"
        assert events[0].setter == "session"


    def test_stream_backfills_new_attributes(self) -> None:
        source = bms.GeometryDataSource([
            {"geometry": point([1, 2]), "name": "A"},
        ])

        source.stream([
            {"geometry": point([3, 4]), "name": "B", "kind": "city"},
        ])

        assert source.data == {"name": ["A", "B"], "kind": [None, "city"]}


    def test_patches_geometry_and_attributes(self) -> None:
        source = bms.GeometryDataSource([
            {"geometry": point([1, 2]), "name": "A"},
        ])

        source.patch({
            "geometry": [(0, point([3, 4]))],
            "name": [(0, "B")],
        })

        assert source.geometries == [{"type": "Point", "coordinates": [3, 4]}]
        assert source.data == {"name": ["B"]}


    def test_patch_uses_one_composite_document_event(self) -> None:
        source = bms.GeometryDataSource([
            {"geometry": point([1, 2]), "name": "A"},
        ])
        document = Document()
        document.add_root(source)
        events = []
        document.on_change(events.append)

        source.patch({
            "geometry": [(0, point([3, 4]))],
            "name": [(0, "B")],
        })

        assert len(events) == 1
        assert isinstance(events[0], ColumnsPatchedEvent)
        assert events[0].attr == "records"


    def test_stream_requires_aligned_attributes(self) -> None:
        source = bms.GeometryDataSource([
            {"geometry": point([1, 2]), "name": "A"},
        ])

        with pytest.raises(ValueError, match="missing: name"):
            source.stream([point([3, 4])])




class TestGeometryDataSourceReplacementUpdates:
    def test_replace_accepts_geojson_strings(self) -> None:
        source = bms.GeometryDataSource(POINT_FEATURE_COLLECTION_JSON)

        initial_geometries, initial_data = source.geometries, source.data

        source.replace('{"type": "Point", "coordinates": [3, 4]}')

        assert initial_geometries == [{"type": "Point", "coordinates": [1, 2]}]
        assert initial_data == {"name": ["A"]}
        assert source.geometries == [{"type": "Point", "coordinates": [3, 4]}]
        assert source.data == {}


    def test_replace_uses_one_composite_document_event(self) -> None:
        source = bms.GeometryDataSource(point([1, 2]))
        document = Document()
        document.add_root(source)
        events = []
        document.on_change(events.append)

        source.replace(point([3, 4]))

        assert len(events) == 1
        assert isinstance(events[0], ColumnDataChangedEvent)
        assert events[0].attr == "records"




@pytest.mark.parametrize("kind, coordinates, path", [
    ("Polygon", [[[0, 0, 7], [1, 0, 8], [0, 1, 9]]], (0, 0, 1)),
    ("MultiPolygon", [[[[0, 0, 7], [1, 0, 8], [0, 1, 9]]]], (0, 0, 0, 1)),
])
def test_incremental_vertices_and_protocol(kind, coordinates, path):
    source = bms.GeometryDataSource({"type": kind, "coordinates": coordinates})
    document = Document()
    document.add_root(source)
    receiver = Document.from_json(document.to_json())
    events = []
    callbacks = []
    document.on_change(events.append)
    source.on_change("geometries", lambda attr, old, new: callbacks.append(attr))
    source.patch({"geometry": [(path, [2, 0, 8])]}, setter="origin")
    append = (*path[:-1], slice(3, 3))
    source.patch({"geometry": [(append, [[0, 2, 10]])]}, setter="origin")
    for event in events:
        message = patch_doc([event])
        apply_patch(message, receiver, setter="receiver")

    assert all(event.setter == "origin" for event in events)
    assert receiver.roots[0].geometries == source.geometries
    assert len(callbacks) == 2
    assert len(events) == 2
    ring = source.geometries[0]["coordinates"]
    for index in path[1:-1]:
        ring = ring[index]
    assert ring == [[0, 0, 7], [2, 0, 8], [0, 1, 9], [0, 2, 10]]


def test_invalid_vertex_patch_is_atomic():
    source = bms.GeometryDataSource.from_xy([0, 1, 0], [0, 0, 1])
    with pytest.raises(ValueError):
        source.patch({"geometry": [((0, 0, 0), [5, 6]), ((0, 0, 99), [7, 8])]})
    assert source.geometries[0]["coordinates"][0][0] == [0, 0]


def test_patch_shaped_vertices():
    coordinates = np.array([[[0., 0., 7.], [1., 0., 8.], [0., 1., 9.]]])
    source = bms.GeometryDataSource()
    source.geometries = [polygon(coordinates)]
    source.patch({"geometry": [((0, 0, 0), [2, 3, 7]), ((0, 0, 1), [4, 5, 8])]})
    assert source.geometries == [{
        "type": "Polygon", "coordinates": [[[2, 3, 7], [4, 5, 8], [0, 1, 9]]],
    }]
    np.testing.assert_array_equal(coordinates, [[[0, 0, 7], [1, 0, 8], [0, 1, 9]]])


def test_patch_shapely_vertices():
    shapely = pytest.importorskip("shapely.geometry")
    source = bms.GeometryDataSource(shapely.Polygon([(0, 0), (1, 0), (0, 1)]))
    source.patch({"geometry": [((0, 0, 1), [2, 0])]})
    assert source.geometries == [{
        "type": "Polygon", "coordinates": [[(0., 0.), [2, 0], (0., 1.), (0., 0.)]],
    }]


def test_held_vertex_updates_keep_order_and_callbacks():
    from bokeh.protocol import apply_patch, patch_doc
    source = bms.GeometryDataSource.from_xy([0, 1, 0], [0, 0, 1])
    document = Document()
    document.add_root(source)
    receiver = Document.from_json(document.to_json())
    events = []
    callbacks = []
    document.on_change(events.append)
    source.on_change("geometries", lambda attr, old, new: callbacks.append(attr))
    document.hold("collect")
    source.patch({"geometry": [((0, 0, 0), [2, 3])]})
    source.patch({"geometry": [((0, 0, slice(3, 3)), [[4, 5]])]})
    callbacks_while_held = list(callbacks)
    document.unhold()
    apply_patch(patch_doc(events), receiver)

    assert callbacks_while_held == []
    assert len(callbacks) == 2
    assert receiver.roots[0].geometries == source.geometries


def test_sequential_vertex_batch_and_protocol():
    data = source()
    doc = Document()
    doc.add_root(data)
    other = Document.from_json(doc.to_json())
    events = []
    doc.on_change(events.append)
    ring = data.geometries[0]["coordinates"][0]
    data.patch({"geometry": [((0, 0, slice(3, 3)), [[2, 3]]), ((0, 0, 3), [4, 5])]})
    apply_patch(patch_doc(events), other)

    assert ring is data.geometries[0]["coordinates"][0]
    assert data.geometries[0]["coordinates"][0][-1] == [4, 5]
    assert other.roots[0].geometries == data.geometries


def test_failed_sequential_batch_rolls_back():
    data = source()
    ring = data.geometries[0]["coordinates"][0]
    with pytest.raises(ValueError):
        data.patch({"geometry": [((0, 0, slice(0, 1)), []), ((0, 0, 2), [4, 5])]})
    assert ring == [[0, 0], [1, 0], [0, 1]]


def test_mixed_replacement_and_vertices_replay_once():
    data = source()
    doc = Document()
    doc.add_root(data)
    other = Document.from_json(doc.to_json())
    events = []
    doc.on_change(events.append)
    geometry = polygon([[[0, 0], [2, 0], [0, 2]]])
    data.patch({"geometry": [(0, geometry), ((0, 0, slice(3, 3)), [[3, 4]])]})
    apply_patch(patch_doc(events), other)
    assert other.roots[0].geometries == data.geometries
    assert len(data.geometries[0]["coordinates"][0]) == 4


def test_vertex_patch_preserves_untouched_shaped_attributes():
    vectors = np.arange(6).reshape((1, 2, 3))
    data = GeometryDataSource.from_xy([0, 1, 0], [0, 0, 1], data={"vectors": vectors})
    data.patch({"geometry": [((0, 0, 0), [2, 3])]})
    assert data.data["vectors"] is vectors


def test_explicit_replacement_preserves_shaped_attributes():
    data = source()
    vectors = np.arange(6).reshape((1, 2, 3))
    data.replace({"geometries": data.geometries, "data": {"vectors": vectors}})
    assert data.data["vectors"] is vectors


def test_shaped_ring_materialization_rolls_back():
    coordinates = np.arange(6).reshape((1, 3, 2))
    data = GeometryDataSource(polygon(coordinates))
    with pytest.raises(ValueError):
        data.patch({"geometry": [((0, 0, 0), [9, 8]), ((0, 0, 9), [4, 5])]})
    assert data.geometries[0]["coordinates"] is coordinates
    np.testing.assert_array_equal(coordinates, np.arange(6).reshape((1, 3, 2)))


def test_vertex_callback_reports_old_value_unavailable():
    data = source()
    original = data.geometries[0]
    seen = []
    data.on_change("geometries", lambda attr, old, new: seen.append((old, new)))
    data.patch({"geometry": [((0, 0, 1), [9, 9])]})
    assert seen[0][0] is OldValueUnavailable
    assert seen[0][1][0]["coordinates"][0][1] == [9, 9]
    assert original is data.geometries[0]


@pytest.mark.parametrize("policy", ["collect", "combine"])
def test_held_replacements_patches_and_streams_replay_in_order(policy):
    data = source()
    doc = Document()
    doc.add_root(data)
    receiver = Document.from_json(doc.to_json())
    events = []
    doc.on_change(events.append)
    doc.hold(policy)
    data.geometries = [polygon([[[1, 1], [2, 1], [1, 2]]])]
    data.patch({"geometry": [((0, 0, 1), [9, 9])]})
    data.geometries = [polygon([[[5, 5], [6, 5], [5, 6]]])]
    data.stream([point([7, 8])])
    doc.unhold()
    apply_patch(patch_doc(events), receiver)
    assert receiver.roots[0].geometries == data.geometries


def test_empty_stream_preserves_new_field_on_replay():
    data = source()
    doc = Document()
    doc.add_root(data)
    receiver = Document.from_json(doc.to_json())
    events = []
    doc.on_change(events.append)
    data.stream({"geometries": [], "data": {"w": []}})
    apply_patch(patch_doc(events), receiver)
    assert receiver.roots[0].data == data.data == {"w": [None]}


def test_numpy_integer_patch_indices_and_boolean_rejection():
    data = source()
    data.patch({"geometry": [((np.int64(0), np.int64(0), np.int64(1)), [9, 9])]})
    with pytest.raises(ValueError, match="integer"):
        data.patch({"geometry": [((False, 0, 1), [0, 0])]})

    assert data.geometries[0]["coordinates"][0][1] == [9, 9]


def test_ndarray_attribute_patches_retain_storage():
    data = GeometryDataSource(geometries=[None, None], data={"v": np.array([1., 2.]), "vectors": np.array([[1., 2.], [3., 4.]])})
    old = data.data["v"]
    data.patch({"v": [(0, 5.)], "vectors": [(0, [5., 6.])]})
    patched_column = data.data["v"]
    data.stream({"geometries": [None], "data": {"v": np.array([3.]), "vectors": np.array([[7., 8.]])}})
    assert isinstance(data.data["v"], np.ndarray)
    assert isinstance(data.data["vectors"], np.ndarray)
    assert data.data["vectors"].shape == (3, 2)
    assert isinstance(patched_column, np.ndarray)
    assert patched_column.dtype == np.float64
    assert patched_column is old
    np.testing.assert_array_equal(old, [5., 2.])
    np.testing.assert_array_equal(data.data["v"], [5., 2., 3.])


def test_vertex_values_normalize_numpy_scalars_locally():
    data = source()
    data.patch({"geometry": [((0, 0, 0), np.array([7, 8], dtype=np.int64))]})
    assert all(type(value) is int for value in data.geometries[0]["coordinates"][0][0])


def test_attribute_slice_error_explains_vertex_only_support():
    data = source()
    data.add([1], "v")
    with pytest.raises(ValueError, match=r"slices.*vertex"):
        data.patch({"v": [(slice(0, 1), [2])]})


def test_unattached_patch_callbacks_receive_unavailable_old_and_current_values():
    data = GeometryDataSource(geometries=[None], data={"v": [1]})
    seen = []
    for attr in ("geometries", "data"):
        data.on_change(attr, lambda attr, old, new: seen.append((attr, old, new)))
    data.patch({"v": [(0, 2)]})
    attrs, old, new = zip(*seen)
    assert attrs == ("geometries", "data")
    assert all(value is OldValueUnavailable for value in old)
    assert new[0] is data.geometries
    assert new[1] is data.data


def test_attached_patch_callbacks_receive_unavailable_old_and_current_values():
    data = GeometryDataSource(geometries=[None], data={"v": [1]})
    doc = Document()
    doc.add_root(data)
    seen = []
    for attr in ("geometries", "data"):
        data.on_change(attr, lambda attr, old, new: seen.append((attr, old, new)))
    data.patch({"v": [(0, 2)]})
    attrs, old, new = zip(*seen)
    assert attrs == ("geometries", "data")
    assert all(value is OldValueUnavailable for value in old)
    assert new[0] is data.geometries
    assert new[1] is data.data


def test_unattached_stream_callbacks_receive_unavailable_old_and_current_values():
    data = GeometryDataSource(geometries=[None], data={"v": [1]})
    seen = []
    for attr in ("geometries", "data"):
        data.on_change(attr, lambda attr, old, new: seen.append((attr, old, new)))
    data.stream({"geometries": [None], "data": {"v": [2]}})
    attrs, old, new = zip(*seen)
    assert attrs == ("geometries", "data")
    assert all(value is OldValueUnavailable for value in old)
    assert new[0] is data.geometries
    assert new[1] is data.data


def test_attached_stream_callbacks_receive_unavailable_old_and_current_values():
    data = GeometryDataSource(geometries=[None], data={"v": [1]})
    doc = Document()
    doc.add_root(data)
    seen = []
    for attr in ("geometries", "data"):
        data.on_change(attr, lambda attr, old, new: seen.append((attr, old, new)))
    data.stream({"geometries": [None], "data": {"v": [2]}})
    attrs, old, new = zip(*seen)
    assert attrs == ("geometries", "data")
    assert all(value is OldValueUnavailable for value in old)
    assert new[0] is data.geometries
    assert new[1] is data.data


@pytest.mark.parametrize("policy", ["collect", "combine"])
def test_held_incremental_callbacks_observe_current_records(policy):
    data = GeometryDataSource(geometries=[None], data={"v": [1]})
    doc = Document()
    doc.add_root(data)
    seen = []
    def changed(attr, old, new):
        assert old is OldValueUnavailable
        assert new is getattr(data, attr)
        assert len(data.geometries) == len(data.data["v"])
        seen.append(attr)
    data.on_change("data", changed)
    data.on_change("geometries", changed)
    doc.hold(policy)
    data.patch({"v": [(0, 2)]})
    data.stream({"geometries": [None], "data": {"v": [3]}})
    calls_while_held = list(seen)
    doc.unhold()

    assert calls_while_held == []
    assert seen == ["geometries", "data", "geometries", "data"]


@pytest.mark.parametrize("policy", [None, "collect", "combine"])
def test_callback_patch_follows_record_streams(policy):
    source = GeometryDataSource(geometries=[None], data={"label": ["A"]})
    document = Document()
    document.add_root(source)
    peer = Document.from_json(document.to_json())
    events = []
    seen = []
    document.on_change(events.append)

    def patch_new_row(attr, old, new):
        if not seen:
            seen.append(list(new["label"]))
            source.patch({"label": [(1, "edited")]})

    source.on_change("data", patch_new_row)
    if policy is not None:
        document.hold(policy)
    incoming = ["B"] if policy is None else ["B", "C"]
    for label in incoming:
        source.stream({"geometries": [None], "data": {"label": [label]}}, rollover=2)
    if policy is not None:
        assert not seen and not events
        document.unhold()

    original, added = ("A", "B") if policy is None else ("B", "C")
    assert seen == [[original, added]]
    assert [event.kind for event in events] == ["ColumnsStreamed"] * len(incoming) + ["ColumnsPatched"]
    assert [event.data["data"]["label"] for event in events[:-1]] == [[label] for label in incoming]
    for event in events:
        apply_patch(patch_doc([event]), peer)
    assert peer.roots[0].data["label"] == source.data["label"] == [original, "edited"]


@pytest.mark.parametrize("initial_policy", ["collect", "combine"])
@pytest.mark.parametrize("fresh_policy", ["collect", "combine"])
def test_callback_rehold_preserves_reserved_record_events(initial_policy, fresh_policy):
    source = GeometryDataSource(geometries=[None], data={"label": ["A"]})
    document = Document()
    document.add_root(source)
    peer = Document.from_json(document.to_json())
    events = []
    seen = []
    document.on_change(events.append)

    def stream(label):
        source.stream({"geometries": [None], "data": {"label": [label]}}, rollover=2)

    def patch_and_hold(attr, old, new):
        seen.append(list(new["label"]))
        if len(seen) == 1:
            source.patch({"label": [(1, "edited")]})
            document.hold(fresh_policy)
            stream("D")

    source.on_change("data", patch_and_hold)
    document.hold(initial_policy)
    stream("B")
    stream("C")
    document.unhold()
    assert [event.kind for event in events] == ["ColumnsStreamed"]
    assert seen == [["B", "C"], ["B", "edited"]]

    document.unhold()
    assert [event.kind for event in events] == [
        "ColumnsStreamed", "ColumnsStreamed", "ColumnsPatched", "ColumnsStreamed",
    ]
    assert [event.data["data"]["label"] for event in events if isinstance(event, ColumnsStreamedEvent)] == [
        ["B"], ["C"], ["D"],
    ]
    assert seen == [["B", "C"], ["B", "edited"], ["edited", "D"], ["edited", "D"]]
    for event in events:
        apply_patch(patch_doc([event]), peer)
    assert peer.roots[0].data["label"] == source.data["label"] == ["edited", "D"]


def test_list_attribute_patch_reuses_storage_and_rolls_back_failed_batches():
    values = [1., 2.]
    data = GeometryDataSource(geometries=[None, None], data={"v": values})
    geometries = data.geometries
    seen = []
    data.on_change("data", lambda attr, old, new: seen.append(old))

    data.patch({"v": [(0, 3.), (0, 4.)]})
    patched_column, patched_geometries = data.data["v"], data.geometries
    patched_values, patched_calls = list(values), list(seen)
    with pytest.raises(ValueError):
        data.patch({"v": [(0, 5.), (0, 6.), (2, 7.)]})

    assert patched_column is values
    assert patched_geometries is geometries
    assert patched_values == [4., 2.]
    assert patched_calls == [OldValueUnavailable]
    assert data.data["v"] is values
    assert list(values) == [4., 2.]
    assert seen == [OldValueUnavailable]


def test_ndarray_attribute_patch_reuses_storage_and_rolls_back_failed_batches():
    values = np.array([1., 2.])
    data = GeometryDataSource(geometries=[None, None], data={"v": values})
    geometries = data.geometries
    seen = []
    data.on_change("data", lambda attr, old, new: seen.append(old))

    data.patch({"v": [(0, 3.), (0, 4.)]})
    patched_column, patched_geometries = data.data["v"], data.geometries
    patched_values, patched_calls = list(values), list(seen)
    with pytest.raises(ValueError):
        data.patch({"v": [(0, 5.), (0, 6.), (2, 7.)]})

    assert patched_column is values
    assert patched_geometries is geometries
    assert patched_values == [4., 2.]
    assert patched_calls == [OldValueUnavailable]
    assert data.data["v"] is values
    assert list(values) == [4., 2.]
    assert seen == [OldValueUnavailable]



def test_failed_shaped_assignment_restores_partially_written_row_and_other_edits():
    values = np.array([[1., 2.], [3., 4.]])
    data = GeometryDataSource.from_xy([0, 1, 0], [0, 0, 1], data={"v": values[:1]})
    ring = data.geometries[0]["coordinates"][0]
    seen = []
    data.on_change("geometries", lambda attr, old, new: seen.append(new))
    with pytest.raises(ValueError):
        data.patch({"geometry": [((0, 0, slice(0, 1)), [])], "v": [(0, [9., "invalid"])]})
    assert data.geometries[0]["coordinates"][0] is ring
    assert ring == [[0, 0], [1, 0], [0, 1], [0, 0]]
    np.testing.assert_array_equal(values, [[1., 2.], [3., 4.]])
    assert not seen


@pytest.mark.parametrize("policy", ["collect", "combine"])
def test_held_stream_then_vertex_append_replays_once(policy):
    data = source()
    doc = Document()
    doc.add_root(data)
    other = Document.from_json(doc.to_json())
    events = []
    doc.on_change(events.append)
    doc.hold(policy)
    data.stream([polygon([[[0, 0], [1, 0], [0, 1]]])])
    data.patch({"geometry": [((1, 0, slice(3, 3)), [[2, 3]])]})
    doc.unhold()
    apply_patch(patch_doc(events), other)
    assert other.roots[0].geometries == data.geometries
    assert len(data.geometries[1]["coordinates"][0]) == 4


def test_queued_record_replacement_payload_is_independent_of_in_place_patches():
    values = np.array([1.])
    data = GeometryDataSource(geometries=[None], data={"v": values})
    doc = Document()
    doc.add_root(data)
    events = []
    doc.on_change(events.append)
    data.replace({"geometries": [None], "data": {"v": values}})
    expected = values.copy()
    data.patch({"v": [(0, 9.)]})
    np.testing.assert_array_equal(events[0].data["data"]["v"], expected)
    assert data.data["v"] is values


def test_queued_attribute_assignment_payload_is_independent_of_in_place_patches():
    data = GeometryDataSource(geometries=[None], data={"v": np.array([1.])})
    doc = Document()
    doc.add_root(data)
    events = []
    doc.on_change(events.append)
    data.data = {"v": np.array([2.])}
    values = data.data["v"]
    expected = values.copy()
    data.patch({"v": [(0, 9.)]})
    np.testing.assert_array_equal(events[0].data["v"], expected)
    assert data.data["v"] is values


def test_full_replacement_callbacks_still_receive_old_records():
    data = GeometryDataSource(geometries=[None], data={"v": [1]})
    old_geometries, old_data = data.geometries, data.data
    seen = []
    for attr in ("geometries", "data"):
        data.on_change(attr, lambda attr, old, new: seen.append(old))
    data.replace({"geometries": [None, None], "data": {"v": [2, 3]}})
    assert seen[0] is old_geometries
    assert seen[1] is old_data


def test_tuple_attribute_columns_remain_patchable():
    values = (1, 2)
    data = GeometryDataSource(geometries=[None, None], data={"v": values})

    data.patch({"v": [(0, 3)]})

    assert list(values) == [1, 2]
    assert list(data.data["v"]) == [3, 2]


def test_readonly_ndarray_attribute_columns_remain_patchable():
    values = np.array([1, 2])
    values.flags.writeable = False
    data = GeometryDataSource(geometries=[None, None], data={"v": values})

    data.patch({"v": [(0, 3)]})

    assert list(values) == [1, 2]
    assert list(data.data["v"]) == [3, 2]



def test_object_dtype_patch_and_rollback():
    values = np.array([None, {"name": "old"}], dtype=object)
    data = GeometryDataSource(geometries=[None, None], data={"v": values})
    data.patch({"v": [(0, "new")]})
    with pytest.raises(ValueError):
        data.patch({"v": [(0, None), (1, {"name": "changed"}), (2, "bad")]})

    assert data.data["v"] is values
    assert values[0] == "new"
    assert values[1] == {"name": "old"}


def test_queued_patch_values_are_independent_of_mutated_array_views():
    values = np.array([[1., 2.], [3., 4.]])
    data = GeometryDataSource(geometries=[None, None], data={"v": values})
    doc = Document()
    doc.add_root(data)
    other = Document.from_json(doc.to_json())
    events = []
    doc.on_change(events.append)
    data.patch({"v": [(0, values[1])]})
    data.patch({"v": [(1, [5., 6.])]})
    np.testing.assert_array_equal(events[0].patches["v"][0][1], [3., 4.])
    apply_patch(patch_doc(events), other)
    np.testing.assert_array_equal(other.roots[0].data["v"], values)


@pytest.mark.parametrize("policy", ["collect", "combine"])
def test_full_attribute_replacements_keep_their_own_wire_fields(policy):
    data = GeometryDataSource(geometries=[None], data={"v": [0]})
    doc = Document()
    doc.add_root(data)
    other = Document.from_json(doc.to_json())
    events = []
    doc.on_change(events.append)
    doc.hold(policy)
    data.data = {"v": [1]}
    data.patch({"v": [(0, 2)]})
    data.data = {"w": [3]}
    data.patch({"w": [(0, 4)]})
    doc.unhold()
    apply_patch(patch_doc(events), other)
    assert other.roots[0].data == data.data == {"w": [4]}
    assert events[0].data == {"v": [1]}


def test_failed_materialized_patch_restores_storage_and_emits_nothing():
    coordinates = np.arange(6).reshape((1, 3, 2))
    values = [1]
    data = GeometryDataSource({"geometries": [polygon(coordinates)], "data": {"v": values}})
    doc = Document()
    doc.add_root(data)
    seen = []
    doc.on_change(seen.append)
    with pytest.raises(ValueError):
        data.patch({"v": [(0, 2)], "geometry": [((0, 0, 1), [7, 8]), ((0, 0, 9), [1, 2])]})
    assert values == [1]
    assert data.geometries[0]["coordinates"] is coordinates
    np.testing.assert_array_equal(coordinates, np.arange(6).reshape((1, 3, 2)))
    assert not seen


@pytest.mark.parametrize("operation", ["replace", "stream"])
def test_misaligned_updates_leave_records_and_callbacks_unchanged(operation):
    data = GeometryDataSource(geometries=[None], data={"v": [1]})
    doc = Document()
    doc.add_root(data)
    seen = []
    doc.on_change(seen.append)
    for attr in ("geometries", "data"):
        data.on_change(attr, lambda attr, old, new: seen.append(new))
    with pytest.raises(ValueError, match="same length"):
        getattr(data, operation)({"geometries": [None, None], "data": {"v": [2]}})
    assert data.geometries == [None]
    assert data.data == {"v": [1]}
    assert seen == []


@pytest.mark.parametrize("rollover", [-1, 1.5, True])
def test_invalid_rollover_is_atomic(rollover):
    data = GeometryDataSource(geometries=[None], data={"v": [1]})
    with pytest.raises(ValueError, match="non-negative integer"):
        data.stream({"geometries": [None], "data": {"v": [2]}}, rollover=rollover)
    assert data.geometries == [None]
    assert data.data == {"v": [1]}


@pytest.mark.parametrize("operation", ["replace", "stream"])
def test_explicit_geometry_interface_updates_use_normalized_wire_values(operation):
    class Point:
        __geo_interface__ = {"type": "Point", "coordinates": (np.int64(1), np.int64(2), np.int64(3))}

    data = GeometryDataSource()
    doc = Document()
    doc.add_root(data)
    other = Document.from_json(doc.to_json())
    events = []
    doc.on_change(events.append)
    getattr(data, operation)({"geometries": [Point()], "data": {"v": [1]}})
    apply_patch(patch_doc(events), other)
    assert other.roots[0].geometries == [{"type": "Point", "coordinates": [1, 2, 3]}]
    assert other.roots[0].data == data.data == {"v": [1]}
    assert data.geometries[0]["coordinates"] == (1, 2, 3)
    assert all(type(value) is int for value in data.geometries[0]["coordinates"])
