from __future__ import absolute_import, print_function

import unittest

import bokeh.document as document
from bokeh.model import Model
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

    def test_should_suppress_model_changed(self):
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

        # integer property changed
        event1 = document.ModelChangedEvent(sample, root, 'foo', root.foo, 42, 42)
        msg = Protocol("1.0").create("PATCH-DOC", [event1])
        assert msg.should_suppress_on_change(event1)
        assert not msg.should_suppress_on_change(document.ModelChangedEvent(sample, root, 'foo', root.foo, 43, 43))
        assert not msg.should_suppress_on_change(document.ModelChangedEvent(sample, root, 'bar', root.foo, 43, 43))
        assert not msg.should_suppress_on_change(document.ModelChangedEvent(sample, other_root, 'foo', root.foo, 43, 43))

        # Model property changed
        event2 = document.ModelChangedEvent(sample, root, 'child', root.child, new_child, new_child)
        msg2 = Protocol("1.0").create("PATCH-DOC", [event2])
        assert msg2.should_suppress_on_change(event2)
        assert not msg2.should_suppress_on_change(document.ModelChangedEvent(sample, root, 'child', root.child, other_root, other_root))
        assert not msg2.should_suppress_on_change(document.ModelChangedEvent(sample, root, 'blah', root.child, new_child, new_child))
        assert not msg2.should_suppress_on_change(document.ModelChangedEvent(sample, other_root, 'child', other_root.child, new_child, new_child))

        # Model property changed to None
        event3 = document.ModelChangedEvent(sample, root, 'child', root.child, None, None)
        msg3 = Protocol("1.0").create("PATCH-DOC", [event3])
        assert msg3.should_suppress_on_change(event3)
        assert not msg3.should_suppress_on_change(document.ModelChangedEvent(sample, root, 'child', root.child, other_root, other_root))
        assert not msg3.should_suppress_on_change(document.ModelChangedEvent(sample, root, 'blah', root.child, None, None))
        assert not msg3.should_suppress_on_change(document.ModelChangedEvent(sample, other_root, 'child', other_root.child, None, None))

        # Model property changed from None
        event4 = document.ModelChangedEvent(sample, other_root, 'child', other_root.child, None, None)
        msg4 = Protocol("1.0").create("PATCH-DOC", [event4])
        assert msg4.should_suppress_on_change(event4)
        assert not msg4.should_suppress_on_change(document.ModelChangedEvent(sample, other_root, 'child', other_root.child, root, root))
        assert not msg4.should_suppress_on_change(document.ModelChangedEvent(sample, other_root, 'blah', other_root.child, None, None))
        assert not msg4.should_suppress_on_change(document.ModelChangedEvent(sample, root, 'child', other_root.child, None, None))

        # RootAdded
        event5 = document.RootAddedEvent(sample, root)
        msg5 = Protocol("1.0").create("PATCH-DOC", [event5])
        assert msg5.should_suppress_on_change(event5)
        assert not msg5.should_suppress_on_change(document.RootAddedEvent(sample, other_root))
        assert not msg5.should_suppress_on_change(document.RootRemovedEvent(sample, root))

        # RootRemoved
        event6 = document.RootRemovedEvent(sample, root)
        msg6 = Protocol("1.0").create("PATCH-DOC", [event6])
        assert msg6.should_suppress_on_change(event6)
        assert not msg6.should_suppress_on_change(document.RootRemovedEvent(sample, other_root))
        assert not msg6.should_suppress_on_change(document.RootAddedEvent(sample, root))

        # ColumnsStreamed
        event7 = document.ModelChangedEvent(sample, root, 'data', 10, None, None,
                                            hint=document.ColumnsStreamedEvent(sample, root, {}, None))
        msg7 = Protocol("1.0").create("PATCH-DOC", [event7])
        assert msg7.should_suppress_on_change(event7)
        assert not msg7.should_suppress_on_change(
            document.ModelChangedEvent(sample, root, 'data', 10, None, None,
                                       hint=document.ColumnsStreamedEvent(sample, root, {}, 10))
        )
        assert not msg7.should_suppress_on_change(
            document.ModelChangedEvent(sample, root, 'data', 10, None, None,
                                       hint=document.ColumnsStreamedEvent(sample, root, {"a": [10]}, None))
        )
        assert not msg7.should_suppress_on_change(
            document.ModelChangedEvent(sample, root, 'data', 10, None, None,
                                       hint=document.ColumnsStreamedEvent(sample, other_root, {}, None))
        )

        # ColumnsPatched
        event8 = document.ModelChangedEvent(sample, root, 'data', 10, None, None,
                                            hint=document.ColumnsPatchedEvent(sample, root, {"a": [(0, 11)]}))
        msg8 = Protocol("1.0").create("PATCH-DOC", [event8])
        assert msg8.should_suppress_on_change(event8)
        assert not msg8.should_suppress_on_change(
            document.ModelChangedEvent(sample, root, 'data', 10, None, None,
                                       hint=document.ColumnsPatchedEvent(sample, root, {}))
        )
        assert not msg8.should_suppress_on_change(
            document.ModelChangedEvent(sample, root, 'data', 10, None, None,
                                       hint=document.ColumnsPatchedEvent(sample, root, {"a": [(0, 10)]}))
        )
        assert msg8.should_suppress_on_change(
            document.ModelChangedEvent(sample, root, 'data', 10, None, None,
                                       hint=document.ColumnsPatchedEvent(sample, root, {"a": [(0, 11)]}))
        )
        assert not msg8.should_suppress_on_change(
            document.ModelChangedEvent(sample, root, 'data', 10, None, None,
                                       hint=document.ColumnsPatchedEvent(sample, other_root, {}))
        )
