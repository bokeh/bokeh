from __future__ import absolute_import, print_function

import unittest

import bokeh.document as document
from bokeh.plot_object import PlotObject
from bokeh.properties import Int, Instance

class AnotherModel(PlotObject):
    bar = Int(1)

class SomeModel(PlotObject):
    foo = Int(2)
    child = Instance(PlotObject)

class TestDocument(unittest.TestCase):

    def test_empty(self):
        d = document.Document()
        assert not d.roots

    def test_add_roots(self):
        d = document.Document()
        assert not d.roots
        d.add_root(AnotherModel())
        assert len(d.roots) == 1
        assert next(iter(d.roots)).document == d

    def test_all_models(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        m = SomeModel()
        m2 = AnotherModel()
        m.child = m2
        d.add_root(m)
        assert len(d.roots) == 1
        assert len(d._all_models) == 2
        m.child = None
        assert len(d._all_models) == 1
        m.child = m2
        assert len(d._all_models) == 2
        d.remove_root(m)
        assert len(d._all_models) == 0

    def test_get_model_by_id(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        m = SomeModel()
        m2 = AnotherModel()
        m.child = m2
        d.add_root(m)
        assert len(d.roots) == 1
        assert len(d._all_models) == 2
        assert d.get_model_by_id(m._id) == m
        assert d.get_model_by_id(m2._id) == m2
        assert d.get_model_by_id("not a valid ID") is None

    def test_all_models_with_multiple_references(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        root1 = SomeModel()
        root2 = SomeModel()
        child1 = AnotherModel()
        root1.child = child1
        root2.child = child1
        d.add_root(root1)
        d.add_root(root2)
        assert len(d.roots) == 2
        assert len(d._all_models) == 3
        root1.child = None
        assert len(d._all_models) == 3
        root2.child = None
        assert len(d._all_models) == 2
        root1.child = child1
        assert len(d._all_models) == 3
        root2.child = child1
        assert len(d._all_models) == 3
        d.remove_root(root1)
        assert len(d._all_models) == 2
        d.remove_root(root2)
        assert len(d._all_models) == 0

    def test_all_models_with_cycles(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        root1 = SomeModel()
        root2 = SomeModel()
        child1 = SomeModel()
        root1.child = child1
        root2.child = child1
        child1.child = root1
        print("adding root1")
        d.add_root(root1)
        print("adding root2")
        d.add_root(root2)
        assert len(d.roots) == 2
        assert len(d._all_models) == 3
        print("clearing child of root1")
        root1.child = None
        assert len(d._all_models) == 3
        print("clearing child of root2")
        root2.child = None
        assert len(d._all_models) == 2
        print("putting child1 back in root1")
        root1.child = child1
        assert len(d._all_models) == 3
# This will fail if uncommented because refcounting isn't
# a reliable GC in the face of cycles. We
# could implement mark-and-sweep or another
# GC algorithm for _all_models but it would be
# less efficient. Do we need to allow cycles?
# (when do we use them?)
#        print("Removing root1")
#        d.remove_root(root1)
#        assert len(d._all_models) == 1
#        print("Removing root2")
#        d.remove_root(root2)
#        assert len(d._all_models) == 0

    def test_change_notification(self):
        d = document.Document()
        assert not d.roots
        m = AnotherModel()
        d.add_root(m)
        assert len(d.roots) == 1
        assert m.bar == 1
        events = []
        def listener(event):
            events.append(event)
        d.on_change(listener)
        m.bar = 42
        assert events
        event = events[0]
        assert isinstance(event, document.ModelChangedEvent)
        assert event.document == d
        assert event.model == m
        assert event.attr == 'bar'
        assert event.old == 1
        assert event.new == 42

    def test_change_notification_removal(self):
        d = document.Document()
        assert not d.roots
        m = AnotherModel()
        d.add_root(m)
        assert len(d.roots) == 1
        assert m.bar == 1
        events = []
        def listener(event):
            events.append(event)
        d.on_change(listener)
        m.bar = 42
        assert len(events) == 1
        assert events[0].new == 42
        d.remove_on_change(listener)
        m.bar = 43
        assert len(events) == 1

    def test_notification_of_roots(self):
        d = document.Document()
        assert not d.roots

        events = []
        def listener(event):
            events.append(event)
        d.on_change(listener)

        m = AnotherModel(bar=1)
        d.add_root(m)
        assert len(d.roots) == 1
        assert len(events) == 1
        assert isinstance(events[0], document.RootAddedEvent)
        assert events[0].model == m
        m2 = AnotherModel(bar=2)
        d.add_root(m2)
        assert len(d.roots) == 2
        assert len(events) == 2
        assert isinstance(events[1], document.RootAddedEvent)
        assert events[1].model == m2

        d.remove_root(m)
        assert len(d.roots) == 1
        assert len(events) == 3
        assert isinstance(events[2], document.RootRemovedEvent)
        assert events[2].model == m

        d.remove_root(m2)
        assert len(d.roots) == 0
        assert len(events) == 4
        assert isinstance(events[3], document.RootRemovedEvent)
        assert events[3].model == m2

    def test_clear(self):
        d = document.Document()
        assert not d.roots
        d.add_root(AnotherModel())
        d.add_root(AnotherModel())
        assert len(d.roots) == 2
        d.clear()
        assert not d.roots
        assert not d._all_models

    def test_serialization_one_model(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        root1 = SomeModel()
        d.add_root(root1)

        json = d.to_json_string()
        copy = document.Document.from_json_string(json)

        assert len(copy.roots) == 1

    def test_serialization_more_models(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        root1 = SomeModel(foo=42)
        root2 = SomeModel(foo=43)
        child1 = SomeModel(foo=44)
        root1.child = child1
        root2.child = child1
        d.add_root(root1)
        d.add_root(root2)
        assert len(d.roots) == 2

        json = d.to_json_string()
        copy = document.Document.from_json_string(json)

        assert len(copy.roots) == 2
        foos = []
        for r in copy.roots:
            foos.append(r.foo)
        foos.sort()
        assert [42,43] == foos

        some_root = next(iter(copy.roots))
        assert some_root.child.foo == 44

    def test_patch_integer_property(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        root1 = SomeModel(foo=42)
        root2 = SomeModel(foo=43)
        child1 = SomeModel(foo=44)
        root1.child = child1
        root2.child = child1
        d.add_root(root1)
        d.add_root(root2)
        assert len(d.roots) == 2

        event1 = document.ModelChangedEvent(d, root1, 'foo', root1.foo, 57)
        patch1 = d.create_json_patch_string([event1])
        d.apply_json_patch_string(patch1)

        assert root1.foo == 57

        event2 = document.ModelChangedEvent(d, child1, 'foo', child1.foo, 67)
        patch2 = d.create_json_patch_string([event2])
        d.apply_json_patch_string(patch2)

        assert child1.foo == 67

    def test_patch_reference_property(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        root1 = SomeModel(foo=42)
        root2 = SomeModel(foo=43)
        child1 = SomeModel(foo=44)
        child2 = SomeModel(foo=45)
        child3 = SomeModel(foo=46, child=child2)
        root1.child = child1
        root2.child = child1
        d.add_root(root1)
        d.add_root(root2)
        assert len(d.roots) == 2

        assert child1._id in d._all_models
        assert child2._id not in d._all_models
        assert child3._id not in d._all_models

        event1 = document.ModelChangedEvent(d, root1, 'child', root1.child, child3)
        patch1 = d.create_json_patch_string([event1])
        d.apply_json_patch_string(patch1)

        assert root1.child._id == child3._id
        assert root1.child.child._id == child2._id
        assert child1._id in d._all_models
        assert child2._id in d._all_models
        assert child3._id in d._all_models

        # put it back how it was before
        event2 = document.ModelChangedEvent(d, root1, 'child', root1.child, child1)
        patch2 = d.create_json_patch_string([event2])
        d.apply_json_patch_string(patch2)

        assert root1.child._id == child1._id
        assert root1.child.child is None

        assert child1._id in d._all_models
        assert child2._id not in d._all_models
        assert child3._id not in d._all_models

    def test_patch_two_properties_at_once(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        root1 = SomeModel(foo=42)
        child1 = SomeModel(foo=43)
        root1.child = child1
        d.add_root(root1)
        assert len(d.roots) == 1
        assert root1.child == child1
        assert root1.foo == 42
        assert root1.child.foo == 43

        child2 = SomeModel(foo=44)

        event1 = document.ModelChangedEvent(d, root1, 'foo', root1.foo, 57)
        event2 = document.ModelChangedEvent(d, root1, 'child', root1.child, child2)
        patch1 = d.create_json_patch_string([event1, event2])
        d.apply_json_patch_string(patch1)

        assert root1.foo == 57
        assert root1.child.foo == 44

    # a more realistic set of models instead of fake models
    def test_scatter(self):
        from bokeh.io import output_document
        from bokeh.plotting import figure
        import numpy as np
        d = document.Document()
        output_document(d)
        assert not d.roots
        assert len(d._all_models) == 0
        p1 = figure(tools=[])
        N = 10
        x = np.linspace(0, 4*np.pi, N)
        y = np.sin(x)
        p1.scatter(x,y, color="#FF00FF", nonselection_fill_color="#FFFF00", nonselection_fill_alpha=1)
        assert len(d.roots) == 1
