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
from bokeh.core.serialization import Buffer, Serialized, Serializer
from bokeh.document import Document
from bokeh.document.events import ModelChangedEvent
from bokeh.models import Selection


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
