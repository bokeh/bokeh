from __future__ import absolute_import, print_function

import unittest

import bokeh.document as document
from bokeh.model import Model
from bokeh.models.sources import ColumnDataSource
from bokeh.core.properties import Int, Instance
from bokeh.server.protocol import Protocol

class AnotherModelInTestPatchDoc(Model):
    bar = Int(1)

class SomeModelInTestPatchDoc(Model):
    foo = Int(2)
    child = Instance(Model)

class TestPatchDocument(unittest.TestCase):

    def _sample_doc(self):
        doc = document.Document()
        another = AnotherModelInTestPatchDoc()
        doc.add_root(SomeModelInTestPatchDoc(child=another))
        doc.add_root(SomeModelInTestPatchDoc())
        return doc

    def test_create_model_changed(self):
        sample = self._sample_doc()
        obj = next(iter(sample.roots))
        event = document.ModelChangedEvent(sample, obj, 'foo', obj.foo, 42, 42)
        Protocol("1.0").create("PATCH-DOC", [event])

    def test_create_then_apply_model_changed(self):
        sample = self._sample_doc()

        foos = []
        for r in sample.roots:
            foos.append(r.foo)
        assert foos == [ 2, 2 ]

        obj = next(iter(sample.roots))
        assert obj.foo == 2
        event = document.ModelChangedEvent(sample, obj, 'foo', obj.foo, 42, 42)
        msg = Protocol("1.0").create("PATCH-DOC", [event])

        copy = document.Document.from_json_string(sample.to_json_string())
        msg.apply_to_document(copy)

        foos = []
        for r in copy.roots:
            foos.append(r.foo)
        foos.sort()
        assert foos == [ 2, 42 ]

    def test_patch_event_contains_setter(self):
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

        cds = ColumnDataSource(data={'a': [0, 1, 2]})
        sample.add_root(cds)

        mock_session = object()
        def sample_document_callback_assert(event):
            """Asserts that setter is correctly set on event"""
            assert event.setter is mock_session
        sample.on_change(sample_document_callback_assert)

        # Model property changed
        event = document.ModelChangedEvent(sample, root, 'child', root.child, new_child, new_child)
        msg = Protocol("1.0").create("PATCH-DOC", [event])
        msg.apply_to_document(sample, mock_session)

        # RootAdded
        event2 = document.RootAddedEvent(sample, root)
        msg2 = Protocol("1.0").create("PATCH-DOC", [event2])
        msg2.apply_to_document(sample, mock_session)

        # RootRemoved
        event3 = document.RootRemovedEvent(sample, root)
        msg3 = Protocol("1.0").create("PATCH-DOC", [event3])
        msg3.apply_to_document(sample, mock_session)

        # ColumnsStreamed
        event4 = document.ModelChangedEvent(sample, cds, 'data', 10, None, None,
                                            hint=document.ColumnsStreamedEvent(sample, cds, {"a": [3]}, None, mock_session))
        msg4 = Protocol("1.0").create("PATCH-DOC", [event4])
        msg4.apply_to_document(sample, mock_session)

        # ColumnsPatched
        event5 = document.ModelChangedEvent(sample, cds, 'data', 10, None, None,
                                            hint=document.ColumnsPatchedEvent(sample, cds, {"a": [(0, 11)]}))
        msg5 = Protocol("1.0").create("PATCH-DOC", [event5])
        msg5.apply_to_document(sample, mock_session)
