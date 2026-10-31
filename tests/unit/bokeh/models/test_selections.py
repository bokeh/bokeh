#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import sys
from array import array

# External imports
import numpy as np
import pytest

# Bokeh imports
from bokeh.core.property.wrappers import PropertyValueDict
from bokeh.core.serialization import (
    Buffer,
    Deserializer,
    Serialized,
    Serializer,
)
from bokeh.document import Document
from bokeh.document.events import ModelChangedEvent
from bokeh.models import Selection
from bokeh.protocol import patch_doc


@pytest.mark.parametrize("attr", ["indices", "line_indices", "multiline_indices"])
@pytest.mark.parametrize("hold", [False, True])
def test_binary_selection_patch(attr: str, hold: bool) -> None:
    selection = Selection()
    doc = Document()
    doc.add_root(selection)
    changes = []
    events = []
    selection.on_change(attr, lambda attr, old, new: changes.append(new))
    doc.on_change(lambda event: events.append(event))
    if hold:
        doc.hold()
    indices = array("i", [0, 42, 2_999_999])
    packed = dict(type="typed_array", dtype="int32", order=sys.byteorder,
                  array=dict(type="bytes", data=dict(id="indices")))
    value = dict(type="map", entries=[[7, packed]]) if attr == "multiline_indices" else packed
    patch = Serialized(dict(events=[dict(kind="ModelChanged", model=selection.ref, attr=attr, new=value)]),
                       buffers=[Buffer(id="indices", data=indices.tobytes())])
    setter = object()

    doc.apply_json_patch(patch, setter=setter)
    if hold:
        assert changes == []
        doc.unhold()

    actual = getattr(selection, attr)
    decoded = actual[7] if attr == "multiline_indices" else actual
    assert decoded == [0, 42, 2_999_999]
    assert changes == [actual]
    assert len(events) == 1
    assert isinstance(events[0], ModelChangedEvent)
    assert events[0].setter is setter

    # Forwarding to another client retains binary transport.
    serializer = Serializer()
    forwarded = serializer.encode(events[0])
    rep = forwarded["new"]
    assert rep["type"] == ("selection_map_v1" if attr == "multiline_indices" else "selection_indices_v1")
    assert len(serializer.buffers) == 1
    assert serializer.buffers[0].to_bytes() == indices.tobytes()


@pytest.mark.parametrize("hold", [False, True])
def test_shared_multiline_patch_forwarding(hold: bool) -> None:
    count = 10_001
    selection = Selection()
    doc = Document()
    doc.add_root(selection)
    changes = []
    events = []
    selection.on_change("multiline_indices", lambda attr, old, new: changes.append(new))
    doc.on_change(lambda event: events.append(event))
    if hold:
        doc.hold()
    packed = array("i", (value for i in range(count) for value in (i, i + 1)))
    if sys.byteorder != "little":
        packed.byteswap()
    shared = dict(type="bytes", data=dict(id="values"))
    rows = [[3*i, dict(mode="int32", count=2, offset=8*i, length=8)] for i in range(count)]
    rows.append([42_000, dict(mode="int32", count=0, offset=8*count, length=0)])
    value = dict(type="selection_map_v1", rows=rows, data=shared)
    patch = Serialized(dict(events=[dict(kind="ModelChanged", model=selection.ref, attr="multiline_indices", new=value)]),
                       buffers=[Buffer("values", packed.tobytes())])
    setter = object()
    doc.apply_json_patch(patch, setter=setter)
    if hold:
        assert changes == []
        doc.unhold()
    assert len(events) == 1
    assert events[0].setter is setter
    assert changes == [selection.multiline_indices]
    assert selection.multiline_indices[42_000] == []
    assert list(selection.multiline_indices)[:3] == [0, 3, 6]
    for i in range(count):
        assert selection.multiline_indices[3*i] == [i, i + 1]

    message = patch_doc([events[0]])
    assert len(message.buffers) == 1
    assert len(message.fragments()) == 2
    assert message.buffers[0].to_bytes() == packed.tobytes()
    decoded = Deserializer([selection]).deserialize(message.payload)["events"][0]["new"]
    assert decoded.keys() == selection.multiline_indices.keys()
    assert decoded == selection.multiline_indices

    # Full documents must use the same packing when another client connects.
    serializer = Serializer()
    serializer.encode(selection)
    assert len(serializer.buffers) == 1


def test_multiline_patch_serializes_captured_value() -> None:
    selection = Selection()
    doc = Document()
    doc.add_root(selection)
    selection.multiline_indices = {7: array("i", [0, 2]), 9: array("i", [1])}
    captured = selection.multiline_indices
    event = selection._create_model_changed_event(doc, "multiline_indices", captured)
    selection.multiline_indices = {42: [3]}
    serializer = Serializer()
    rep = serializer.encode(event)
    assert len(serializer.buffers) == 1
    assert Deserializer([selection]).deserialize(Serialized(rep, serializer.buffers))["new"] == {7: [0, 2], 9: [1]}
    assert selection.multiline_indices[42] == [3]


@pytest.mark.parametrize("attr", ["indices", "line_indices", "multiline_indices"])
def test_equal_received_indices_do_not_notify(attr: str) -> None:
    original = {7: [1, 2]} if attr == "multiline_indices" else [1, 2]
    received = {7: array("i", [1, 2])} if attr == "multiline_indices" else array("i", [1, 2])
    selection = Selection(**{attr: original})
    doc = Document()
    doc.add_root(selection)
    changes = []
    selection.on_change(attr, lambda attr, old, new: changes.append(new))
    serializer = Serializer()
    payload = serializer.encode(selection._create_model_changed_event(doc, attr, received))
    doc.apply_json_patch(Serialized(dict(events=[payload]), serializer.buffers))
    assert changes == []
    value = getattr(selection, attr)
    values = value[7] if attr == "multiline_indices" else value
    assert isinstance(values, list)
    assert values == [1, 2]


@pytest.mark.parametrize("attr", ["indices", "line_indices", "multiline_indices"])
@pytest.mark.parametrize("values", [[0, 2], (0, 2), array("i", [0, 2]), np.array([0, 2], dtype=np.int64)])
def test_canonical_selection_ingestion(attr: str, values: object) -> None:
    value = {7: values} if attr == "multiline_indices" else values
    selection = Selection(**{attr: value})
    for _ in range(2):
        actual = getattr(selection, attr)
        actual = actual[7] if attr == "multiline_indices" else actual
        assert isinstance(actual, list)
        assert actual == [0, 2]
        setattr(selection, attr, value)


@pytest.mark.parametrize("attr", ["indices", "line_indices", "multiline_indices"])
@pytest.mark.parametrize("values", [[2**31], [-1], [-2**31-1], [1.5], [[1]], np.array([1.0]), [True], [False, 1], [np.bool_(False), 1]])
def test_invalid_selection_indices(attr: str, values: object) -> None:
    with pytest.raises(ValueError):
        Selection(**{attr: {7: values} if attr == "multiline_indices" else values})


def test_canonical_defaults_and_multiline_mutation() -> None:
    first, second = Selection(), Selection()
    assert first.indices == first.line_indices == []
    assert first.indices is not second.indices
    first.multiline_indices[3] = [1, 2]
    assert first.multiline_indices[3] == [1, 2]


@pytest.mark.parametrize("attr", ["indices", "line_indices", "multiline_indices"])
def test_selection_set_semantics_and_callbacks(attr: str) -> None:
    def value(indices):
        return {7: indices} if attr == "multiline_indices" else indices

    selection = Selection(**{attr: value([9, 2, 9, 1])})
    assert getattr(selection, attr) == value([1, 2, 9])
    changes = []
    selection.on_change(attr, lambda attr, old, new: changes.append((old, new)))
    setattr(selection, attr, value([9, 1, 2, 2]))
    assert changes == []
    setattr(selection, attr, value([3, 1, 3]))
    assert changes == [(value([1, 2, 9]), value([1, 3]))]
    assert isinstance(changes[0][1][7] if attr == "multiline_indices" else changes[0][1], list)


@pytest.mark.parametrize("attr", ["indices", "line_indices"])
@pytest.mark.parametrize("empty", [False, True])
def test_held_selection_list_keeps_identity_and_notifies(attr: str, empty: bool) -> None:
    initial = [] if empty else [1, 3]
    selection = Selection(**{attr: initial})
    held = getattr(selection, attr)
    changes = []

    def callback(attr, old, new):
        assert getattr(selection, attr) is held
        changes.append((list(old), list(new)))

    selection.on_change(attr, callback)
    held.extend([5, 2, 5])
    first = [2, 5] if empty else [1, 2, 3, 5]
    assert held == first
    held.append(7)
    second = [*first, 7]
    assert held == second
    held.append(7)
    held.reverse()
    assert held == second
    assert len(changes) == 2
    del held[:]
    assert held == []
    held.extend([8, 1, 8])
    assert held == [1, 8]
    assert getattr(selection, attr) is held
    assert changes == [(initial, first), (first, second), (second, []), ([], [1, 8])]


@pytest.mark.parametrize("empty", [False, True])
def test_held_multiline_map_keeps_identity_and_notifies(empty: bool) -> None:
    initial = {} if empty else {7: [1, 3]}
    selection = Selection(multiline_indices=initial)
    held = selection.multiline_indices
    changes = []

    def snapshot(value):
        return {key: list(indices) for key, indices in value.items()}

    def callback(attr, old, new):
        assert selection.multiline_indices is held
        changes.append((snapshot(old), snapshot(new)))

    selection.on_change("multiline_indices", callback)
    held.update({7: [5, 1, 5], 2: [4, 4]})
    first = {2: [4], 7: [1, 5]}
    assert held == first
    assert list(held) == [2, 7]
    held[7] = [5, 1, 5]
    assert held == first
    assert len(changes) == 1
    del held[2]
    held[3] = [9, 8, 9]
    assert held == {3: [8, 9], 7: [1, 5]}
    assert list(held) == [3, 7]
    assert selection.multiline_indices is held
    assert changes == [(initial, first), (first, {7: [1, 5]}), ({7: [1, 5]}, {3: [8, 9], 7: [1, 5]})]


def test_multiline_ingestion_does_not_mutate_foreign_property_dict() -> None:
    supplied = PropertyValueDict({7: [3, 1, 3]})
    selection = Selection(multiline_indices=supplied)
    assert supplied == {7: [3, 1, 3]}
    assert supplied._owners == set()
    assert selection.multiline_indices == {7: [1, 3]}
    assert selection.multiline_indices is not supplied


def test_held_selection_list_normalizes_across_array_chunks() -> None:
    count = 65_537
    selection = Selection(indices=list(range(count)))
    held = selection.indices
    changes = []
    selection.on_change("indices", lambda attr, old, new: changes.append(list(new)))
    held.extend(reversed(held))
    assert selection.indices is held
    assert held == list(range(count))
    assert changes == []
    held.append(count)
    assert selection.indices is held
    assert changes == [list(range(count + 1))]


@pytest.mark.parametrize("attr", ["indices", "line_indices", "multiline_indices"])
def test_shared_selection_container_keeps_all_owners(attr: str) -> None:
    first = Selection(**{attr: {7: [1]} if attr == "multiline_indices" else [1]})
    held = getattr(first, attr)
    second = Selection(**{attr: held})
    changes = [[], []]
    for model, events in zip([first, second], changes):
        model.on_change(attr, lambda attr, old, new, events=events: events.append(new))
    if attr == "multiline_indices":
        held[7] = [5, 1, 5]
        held[2] = [2]
    else:
        held.append(5)
        held.append(7)
    assert getattr(first, attr) is getattr(second, attr) is held
    assert [len(events) for events in changes] == [2, 2]


def test_selection_list_mutation_notifies_and_normalizes() -> None:
    selection = Selection(indices=[1, 3])
    changes = []
    selection.on_change("indices", lambda attr, old, new: changes.append((old, new)))
    selection.indices.append(2)
    assert selection.indices == [1, 2, 3]
    assert changes == [([1, 3], [1, 2, 3])]
    selection.indices.append(2)
    assert len(changes) == 1
    assert selection.indices == [1, 2, 3]
    selection.indices.reverse()
    assert selection.indices == [1, 2, 3]
    assert len(changes) == 1


@pytest.mark.parametrize("binary", [False, True])
@pytest.mark.parametrize("attr", ["indices", "line_indices", "multiline_indices"])
def test_adaptive_full_document_and_captured_event(attr: str, binary: bool) -> None:
    def value(indices):
        return {7: indices, 42: []} if attr == "multiline_indices" else indices

    original = value(list(range(300)))
    selection = Selection(**{attr: original})
    doc = Document()
    doc.add_root(selection)
    serializer = Serializer(deferred=binary)
    model = serializer.encode(selection)
    restored = Deserializer().deserialize(Serialized(model, serializer.buffers))
    assert getattr(restored, attr) == original
    assert isinstance(restored.indices, list)
    if binary:
        assert len(serializer.buffers) == 1
        relevant = model["attributes"][attr]
        meta = relevant["rows"][0][1] if attr == "multiline_indices" else relevant
        assert meta["mode"] == "bitmap"
    else:
        assert serializer.buffers == []
    captured = selection._create_model_changed_event(doc, attr, original)
    setattr(selection, attr, value([99]))
    serializer = Serializer(deferred=binary)
    rep = serializer.encode(captured)
    received = Deserializer([selection]).deserialize(Serialized(rep, serializer.buffers))["new"]
    assert received == original


@pytest.mark.parametrize("values", [list(range(300)), list(range(0, 3000, 10)), [0, 2147483647], []])
def test_adaptive_binary_representation(values: list[int]) -> None:
    selection = Selection(indices=values)
    serializer = Serializer()
    rep = serializer.encode(selection._create_model_changed_event(None, "indices", selection.indices))["new"]
    if not values:
        assert rep == []
        assert not serializer.buffers
        return
    assert rep["mode"] == ("bitmap" if len(values) == 300 else "int32")
    assert len(serializer.buffers) == 1
    assert Deserializer().deserialize(Serialized(rep, serializer.buffers)) == values


@pytest.mark.parametrize("meta,data", [
    (dict(mode="int32", count=2), b"\x00"*4),
    (dict(mode="int32", count=2), np.array([1, 1], dtype="<i4").tobytes()),
    (dict(mode="int32", count=2), np.array([2, 1], dtype="<i4").tobytes()),
    (dict(mode="int32", count=1), np.array([-1], dtype="<i4").tobytes()),
    (dict(mode="bitmap", count=2, span=8, origin=0), b"\x01"),
    (dict(mode="bitmap", count=1, span=8, origin=0), b"\x03"),
    (dict(mode="bitmap", count=8, span=8, origin=0), b"\x7f"),
    (dict(mode="bitmap", count=1, span=1, origin=0), b"\x80"),
    (dict(mode="bitmap", count=1, span=2, origin=2**31-1), b"\x01"),
    (dict(mode="bitmap", count=1, span=9, origin=0), b"\x01"),
    (dict(mode="unknown", count=0), b""),
])
def test_reject_invalid_selection_wire_values(meta, data) -> None:
    rep = dict(type="selection_indices_v1", data=dict(type="bytes", data=dict(id="bad")), **meta)
    with pytest.raises(ValueError):
        Deserializer().deserialize(Serialized(rep, [Buffer("bad", data)]))


@pytest.mark.parametrize("mutation", ["overlap", "overrun", "count", "key", "padding", "trailing"])
def test_reject_invalid_multiline_wire_values(mutation: str) -> None:
    selection = Selection(multiline_indices={0: list(range(100)), 1: [3]})
    serializer = Serializer()
    rep = serializer.encode(selection._create_model_changed_event(None, "multiline_indices", selection.multiline_indices))["new"]
    buffers = serializer.buffers
    rep["data"]["data"] = dict(id=buffers[0].id)
    if mutation == "overlap":
        rep["rows"][1][1]["offset"] = 0
    elif mutation == "overrun":
        rep["rows"][0][1]["length"] = 1000
    elif mutation == "count":
        rep["rows"][0][1]["count"] = 101
    elif mutation == "key":
        rep["rows"][1][0] = 0
    elif mutation == "padding":
        end = rep["rows"][0][1]["length"]
        assert end < rep["rows"][1][1]["offset"]
        data = bytearray(buffers[0].to_bytes())
        data[end] = 1
        buffers[0] = Buffer(buffers[0].id, bytes(data))
    else:
        rep["rows"].pop()
    with pytest.raises(ValueError):
        Deserializer().deserialize(Serialized(rep, buffers))


@pytest.mark.parametrize("rows", [None, {}, [None], [[0]], [[0, None]]])
def test_reject_invalid_multiline_rows(rows: object) -> None:
    rep = dict(type="selection_map_v1", rows=rows, data=dict(type="bytes", data=dict(id="bad")))
    with pytest.raises(ValueError, match="invalid multiline row"):
        Deserializer().deserialize(Serialized(rep, [Buffer("bad", b"")]))



def test_equal_multiline_mutation_restores_canonical_values_without_notifying() -> None:
    selection = Selection(multiline_indices={7: [1, 3]})
    changes = []
    selection.on_change("multiline_indices", lambda attr, old, new: changes.append(new))
    selection.multiline_indices[7] = [3, 1, 3]
    assert selection.multiline_indices == {7: [1, 3]}
    assert changes == []


@pytest.mark.parametrize("values", [[np.int32(0), np.int32(2147483647)],
                                   [np.int32(i) for i in range(2147483347, 2147483648)]])
def test_numpy_scalar_lists_round_trip_without_integer_overflow(values) -> None:
    selection = Selection(indices=values)
    serializer = Serializer()
    rep = serializer.encode(selection._create_model_changed_event(None, "indices", selection.indices))
    actual = Deserializer([selection]).deserialize(Serialized(rep, serializer.buffers))["new"]
    assert actual == [int(value) for value in values]


@pytest.mark.parametrize("mutate", [
    lambda value: value.append(4),
    lambda value: value.extend([4, 2]),
    lambda value: value.insert(0, 4),
    lambda value: value.pop(),
    lambda value: value.remove(2),
    lambda value: value.reverse(),
    lambda value: value.sort(reverse=True),
    lambda value: value.__setitem__(0, 4),
    lambda value: value.__setitem__(slice(0, 2), [4, 1]),
    lambda value: value.__delitem__(0),
    lambda value: value.__iadd__([4, 1]),
    lambda value: value.__imul__(2),
    lambda value: value.clear(),
])
def test_selection_encoding_revalidates_mutated_unowned_list(mutate) -> None:
    selection = Selection(indices=[1, 2, 3])
    captured = selection.indices
    selection.indices = []
    mutate(captured)
    expected = sorted(set(captured))
    serializer = Serializer()
    rep = serializer.encode(selection._create_model_changed_event(None, "indices", captured))
    actual = Deserializer([selection]).deserialize(Serialized(rep, serializer.buffers))["new"]
    assert actual == expected
    assert isinstance(actual, list)


def test_selection_encoding_revalidates_after_partial_failed_mutation() -> None:
    selection = Selection(indices=[1, 2, 3])
    captured = selection.indices
    selection.indices = []

    def broken():
        yield 0
        yield -1
        raise RuntimeError("interrupted")

    with pytest.raises(RuntimeError, match="interrupted"):
        captured.extend(broken())
    with pytest.raises(ValueError):
        Serializer().encode(selection._create_model_changed_event(None, "indices", captured))


def test_multiline_encoding_revalidates_mutated_nested_lists() -> None:
    selection = Selection(multiline_indices={7: [1, 2, 3]})
    selection.multiline_indices[7].extend([4, 1])
    serializer = Serializer()
    rep = serializer.encode(selection._create_model_changed_event(None, "multiline_indices", selection.multiline_indices))
    actual = Deserializer([selection]).deserialize(Serialized(rep, serializer.buffers))["new"]
    assert actual == {7: [1, 2, 3, 4]}


@pytest.mark.parametrize("key", [-1, 2147483648, True, "1", 1.5])
def test_selection_rejects_invalid_multiline_keys_during_ingestion(key) -> None:
    with pytest.raises(ValueError):
        Selection(multiline_indices={key: [1, 2]})


def test_decoded_selection_is_a_list_with_working_mutation_notifications() -> None:
    selection = Selection(indices=list(range(300)))
    doc = Document()
    doc.add_root(selection)
    serializer = Serializer()
    rep = serializer.encode(selection)
    received = Deserializer().deserialize(Serialized(rep, serializer.buffers))
    changes = []
    received.on_change("indices", lambda attr, old, new: changes.append((old, new)))
    received.indices.append(300)
    assert isinstance(received.indices, list)
    assert received.indices == list(range(301))
    assert len(changes) == 1
    assert changes[0][0] == list(range(300))
    assert changes[0][1] == list(range(301))
    clone = received.clone()
    clone.indices = [9, 1, 9]
    assert clone.indices == [1, 9]
    assert received.indices == list(range(301))


@pytest.mark.parametrize("origin", [0, 2147473648])
def test_chunked_bitmap_packing_combines_multiple_bits_in_each_byte(origin: int) -> None:
    values = [origin + index for index in range(10000) if index % 11]
    selection = Selection(indices=values)
    serializer = Serializer()
    rep = serializer.encode(selection._create_model_changed_event(None, "indices", selection.indices))
    assert rep["new"]["mode"] == "bitmap"
    actual = Deserializer([selection]).deserialize(Serialized(rep, serializer.buffers))["new"]
    assert actual == values


@pytest.mark.parametrize("attr", ["indices", "line_indices", "multiline_indices"])
@pytest.mark.parametrize("deferred", [False, True])
def test_selection_values_serialize_without_property_context(attr: str, deferred: bool) -> None:
    raw = {7: [3, 1, 3]} if attr == "multiline_indices" else [3, 1, 3]
    expected = {7: [1, 3]} if attr == "multiline_indices" else [1, 3]
    selection = Selection(**{attr: raw})
    captured = getattr(selection, attr)
    setattr(selection, attr, {} if attr == "multiline_indices" else [])
    serializer = Serializer(deferred=deferred)
    rep = serializer.encode(captured)
    assert Deserializer().deserialize(Serialized(rep, serializer.buffers)) == expected
    assert not serializer.buffers


@pytest.mark.parametrize("attr", ["indices", "line_indices", "multiline_indices"])
def test_binary_selection_encoding_does_not_escape_model_context(attr: str) -> None:
    raw = {7: list(range(300))} if attr == "multiline_indices" else list(range(300))
    selection = Selection(**{attr: raw})
    held = getattr(selection, attr)
    serializer = Serializer()
    rep = serializer.encode([held, selection, held])
    assert len(serializer.buffers) == 1
    assert rep[0] == rep[2]
    decoded = Deserializer().deserialize(Serialized(rep, serializer.buffers))
    assert decoded[0] == decoded[2] == raw
    assert getattr(decoded[1], attr) == raw
    setattr(selection, attr, {} if attr == "multiline_indices" else [])
    serializer = Serializer()
    assert Deserializer().decode(serializer.encode(held)) == raw
    assert not serializer.buffers


@pytest.mark.parametrize("attr", ["indices", "line_indices", "multiline_indices"])
def test_combined_selection_event_serializes_latest_public_value(attr: str) -> None:
    selection = Selection()
    doc = Document()
    doc.add_root(selection)
    events = []
    doc.on_change(events.append)
    doc.hold()
    setattr(selection, attr, {7: [1]} if attr == "multiline_indices" else [1])
    latest = {7: [2, 4]} if attr == "multiline_indices" else [2, 4]
    setattr(selection, attr, latest)
    doc.unhold()
    assert len(events) == 1
    assert events[0].new is getattr(selection, attr)
    serializer = Serializer()
    rep = serializer.encode(events[0])
    assert len(serializer.buffers) == 1
    assert Deserializer([selection]).deserialize(Serialized(rep, serializer.buffers))["new"] == latest
