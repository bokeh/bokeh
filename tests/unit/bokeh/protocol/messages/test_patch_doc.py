#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# External imports
import numpy as np

# Bokeh imports
import bokeh.document as document
from bokeh.core.properties import Instance, Int, Nullable
from bokeh.document.events import (
    ColumnDataChangedEvent,
    ColumnsPatchedEvent,
    ColumnsStreamedEvent,
    ModelChangedEvent,
    RootAddedEvent,
    RootRemovedEvent,
)
from bokeh.model import Model
from bokeh.models import ColumnDataSource
from bokeh.protocol import Protocol

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

proto = Protocol()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class AnotherModelInTestPatchDoc(Model):
    bar = Int(1)

class SomeModelInTestPatchDoc(Model):
    foo = Int(2)
    child = Nullable(Instance(Model))


class TestPatchDocument:
    def _sample_doc(self):
        doc = document.Document()
        another = AnotherModelInTestPatchDoc()
        doc.add_root(SomeModelInTestPatchDoc(child=another))
        doc.add_root(SomeModelInTestPatchDoc())
        return doc

    def test_create_no_events(self) -> None:
        with pytest.raises(ValueError):
            proto.create("PATCH-DOC", [])

    def test_create_multiple_docs(self) -> None:
        sample1 = self._sample_doc()
        obj1 = next(iter(sample1.roots))
        event1 = ModelChangedEvent(sample1, obj1, 'foo', 42)

        sample2 = self._sample_doc()
        obj2 = next(iter(sample2.roots))
        event2 = ModelChangedEvent(sample2, obj2, 'foo', 42)
        with pytest.raises(ValueError):
            proto.create("PATCH-DOC", [event1, event2])

    def test_create_model_changed(self) -> None:
        sample = self._sample_doc()
        obj = next(iter(sample.roots))
        event = ModelChangedEvent(sample, obj, 'foo', 42)
        proto.create("PATCH-DOC", [event])

    def test_create_then_apply_model_changed(self) -> None:
        sample = self._sample_doc()

        foos = []
        for r in sample.roots:
            foos.append(r.foo)
        assert foos == [ 2, 2 ]

        obj = next(iter(sample.roots))
        assert obj.foo == 2
        event = ModelChangedEvent(sample, obj, 'foo', 42)
        msg = proto.create("PATCH-DOC", [event])

        copy = document.Document.from_json(sample.to_json())
        msg.apply_to_document(copy)

        foos = []
        for r in copy.roots:
            foos.append(r.foo)
        foos.sort()
        assert foos == [ 2, 42 ]

    def test_patch_event_contains_setter(self) -> None:
        sample = self._sample_doc()
        root = None
        other_root = None
        for r in sample.roots:
            if r.child is not None:
                root = r
            else:
                other_root = r
        assert root is not None
        assert other_root is not None
        new_child = AnotherModelInTestPatchDoc(bar=56)

        cds = ColumnDataSource(data={'a': np.array([0., 1., 2.])})
        sample.add_root(cds)

        mock_session = object()
        def sample_document_callback_assert(event):
            """Asserts that setter is correctly set on event"""
            assert event.setter is mock_session
        sample.on_change(sample_document_callback_assert)

        # Model property changed
        event = ModelChangedEvent(sample, root, 'child', new_child)
        msg = proto.create("PATCH-DOC", [event])
        msg.apply_to_document(sample, mock_session)
        assert msg.buffers == []

        # RootAdded
        event2 = RootAddedEvent(sample, root)
        msg2 = proto.create("PATCH-DOC", [event2])
        msg2.apply_to_document(sample, mock_session)
        assert msg2.buffers == []

        # RootRemoved
        event3 = RootRemovedEvent(sample, root)
        msg3 = proto.create("PATCH-DOC", [event3])
        msg3.apply_to_document(sample, mock_session)
        assert msg3.buffers == []

        # ColumnsStreamed
        event4 = ColumnsStreamedEvent(sample, cds, "data", {"a": [3]}, None, mock_session)
        msg4 = proto.create("PATCH-DOC", [event4])
        msg4.apply_to_document(sample, mock_session)
        assert msg4.buffers == []

        # ColumnsPatched
        event5 = ColumnsPatchedEvent(sample, cds, "data", {"a": [(0, 11)]})
        msg5 = proto.create("PATCH-DOC", [event5])
        msg5.apply_to_document(sample, mock_session)
        assert msg5.buffers == []

        # ColumnDataChanged
        event7 = ColumnDataChangedEvent(sample, cds, "data")
        msg7 = proto.create("PATCH-DOC", [event7])
        msg7.apply_to_document(sample, mock_session)
        assert len(msg7.buffers) == 1

        # reports CDS buffer *as it is* Normally events called by setter and
        # value in local object would have been already mutated.
        [buf] = msg7.buffers
        assert bytes(buf.data) == np.array([11., 1., 2., 3]).tobytes()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
