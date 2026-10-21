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
import pytest

# Bokeh imports
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
    assert list(decoded) == [0, 42, 2_999_999]
    assert changes == [actual]
    assert len(events) == 1
    assert isinstance(events[0], ModelChangedEvent)
    assert events[0].setter is setter

    # Forwarding to another client retains binary transport.
    serializer = Serializer()
    forwarded = serializer.encode(events[0])
    rep = forwarded["new"]
    if attr == "multiline_indices":
        rep = rep["entries"][0][1]
    assert rep["type"] == "typed_array"
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
    shared = dict(type="bytes", data=dict(id="values"))
    entries = [(3*i, dict(type="typed_array", dtype="int32", order=sys.byteorder,
                         array=shared, byte_offset=8*i, length=2)) for i in range(count)]
    entries.insert(1, (-1, []))
    value = dict(type="map", entries=entries)
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
    assert selection.multiline_indices[-1] == []
    assert list(selection.multiline_indices)[:3] == [0, -1, 3]
    for i in range(count):
        assert list(selection.multiline_indices[3*i]) == [i, i + 1]

    message = patch_doc([events[0]])
    assert len(message.buffers) == 1
    assert len(message.fragments()) == 2
    assert message.buffers[0].to_bytes() == packed.tobytes()
    decoded = Deserializer([selection]).deserialize(message.payload)["events"][0]["new"]
    assert decoded == selection.multiline_indices

    # Full documents must use the same packing when another client connects.
    serializer = Serializer()
    serializer.encode(selection)
    assert len(serializer.buffers) == 1


def test_multiline_patch_serializes_captured_value() -> None:
    selection = Selection()
    doc = Document()
    doc.add_root(selection)
    captured = {7: array("i", [0, 2]), 9: array("i", [1])}
    event = ModelChangedEvent(doc, selection, "multiline_indices", captured)
    selection.multiline_indices = {42: [3]}
    serializer = Serializer()
    rep = serializer.encode(event)
    assert len(serializer.buffers) == 1
    assert Deserializer([selection]).deserialize(Serialized(rep, serializer.buffers))["new"] == captured
    assert selection.multiline_indices == {42: [3]}


@pytest.mark.parametrize("attr", ["indices", "line_indices", "multiline_indices"])
def test_received_sequence_type_change_notifies_for_equal_indices(attr: str) -> None:
    original = {7: [1, 2]} if attr == "multiline_indices" else [1, 2]
    received = {7: array("i", [1, 2])} if attr == "multiline_indices" else array("i", [1, 2])
    selection = Selection(**{attr: original})
    doc = Document()
    doc.add_root(selection)
    changes = []
    selection.on_change(attr, lambda attr, old, new: changes.append((old, new)))
    event = ModelChangedEvent(doc, selection, attr, received)
    serializer = Serializer()
    payload = serializer.encode(event)
    doc.apply_json_patch(Serialized(dict(events=[payload]), serializer.buffers))
    assert len(changes) == 1
    old, new = changes[0]
    old_values = old[7] if attr == "multiline_indices" else old
    new_values = new[7] if attr == "multiline_indices" else new
    assert isinstance(old_values, list)
    assert isinstance(new_values, array)
    assert list(old_values) == list(new_values)
    doc.apply_json_patch(Serialized(dict(events=[payload]), serializer.buffers))
    assert len(changes) == 1
