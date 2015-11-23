from __future__ import absolute_import, print_function

import unittest

import bokeh.document as document
from bokeh.io import curdoc
from bokeh.model import Model
from bokeh.properties import Int, Instance, String

class AnotherModelInTestDocument(Model):
    bar = Int(1)

class SomeModelInTestDocument(Model):
    foo = Int(2)
    child = Instance(Model)

class ModelThatOverridesName(Model):
    name = String()

class TestDocument(unittest.TestCase):

    def test_empty(self):
        d = document.Document()
        assert not d.roots

    def test_add_roots(self):
        d = document.Document()
        assert not d.roots
        d.add_root(AnotherModelInTestDocument())
        assert len(d.roots) == 1
        assert next(iter(d.roots)).document == d

    def test_set_title(self):
        d = document.Document()
        assert d.title == document.DEFAULT_TITLE
        d.title = "Foo"
        assert d.title == "Foo"

    def test_all_models(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        m = SomeModelInTestDocument()
        m2 = AnotherModelInTestDocument()
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
        m = SomeModelInTestDocument()
        m2 = AnotherModelInTestDocument()
        m.child = m2
        d.add_root(m)
        assert len(d.roots) == 1
        assert len(d._all_models) == 2
        assert d.get_model_by_id(m._id) == m
        assert d.get_model_by_id(m2._id) == m2
        assert d.get_model_by_id("not a valid ID") is None

    def test_get_model_by_name(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        m = SomeModelInTestDocument(name="foo")
        m2 = AnotherModelInTestDocument(name="bar")
        m.child = m2
        d.add_root(m)
        assert len(d.roots) == 1
        assert len(d._all_models) == 2
        assert len(d._all_models_by_name._dict) == 2
        assert d.get_model_by_name(m.name) == m
        assert d.get_model_by_name(m2.name) == m2
        assert d.get_model_by_name("not a valid name") is None

    def test_get_model_by_changed_name(self):
        d = document.Document()
        m = SomeModelInTestDocument(name="foo")
        d.add_root(m)
        assert d.get_model_by_name("foo") == m
        m.name = "bar"
        assert d.get_model_by_name("foo") == None
        assert d.get_model_by_name("bar") == m

    def test_get_model_by_changed_from_none_name(self):
        d = document.Document()
        m = SomeModelInTestDocument(name=None)
        d.add_root(m)
        assert d.get_model_by_name("bar") == None
        m.name = "bar"
        assert d.get_model_by_name("bar") == m

    def test_get_model_by_changed_to_none_name(self):
        d = document.Document()
        m = SomeModelInTestDocument(name="bar")
        d.add_root(m)
        assert d.get_model_by_name("bar") == m
        m.name = None
        assert d.get_model_by_name("bar") == None

    def test_can_get_name_overriding_model_by_name(self):
        d = document.Document()
        m = ModelThatOverridesName(name="foo")
        d.add_root(m)
        assert d.get_model_by_name("foo") == m
        m.name = "bar"
        assert d.get_model_by_name("bar") == m

    def test_cannot_get_model_with_duplicate_name(self):
        d = document.Document()
        m = SomeModelInTestDocument(name="foo")
        m2 = SomeModelInTestDocument(name="foo")
        d.add_root(m)
        d.add_root(m2)
        got_error = False
        try:
            d.get_model_by_name("foo")
        except ValueError as e:
            got_error = True
            assert 'Found more than one' in repr(e)
        assert got_error
        d.remove_root(m)
        assert d.get_model_by_name("foo") == m2

    def test_select(self):
        # we aren't trying to replace test_query here, only test
        # our wrappers around it, so no need to try every kind of
        # query
        d = document.Document()
        root1 = SomeModelInTestDocument(foo=42, name='a')
        child1 = SomeModelInTestDocument(foo=43, name='b')
        root2 = SomeModelInTestDocument(foo=44, name='c')
        root3 = SomeModelInTestDocument(foo=44, name='d')
        child3 = SomeModelInTestDocument(foo=45, name='c')
        root1.child = child1
        root3.child = child3
        d.add_root(root1)
        d.add_root(root2)
        d.add_root(root3)

        # select()
        assert set([root1]) == set(d.select(dict(foo=42)))
        assert set([root1]) == set(d.select(dict(name='a')))
        assert set([root2, child3])  == set(d.select(dict(name='c')))
        assert set()  == set(d.select(dict(name='nope')))

        # select() on object
        assert set() == set(root3.select(dict(name='a')))
        assert set([child3]) == set(root3.select(dict(name='c')))

        # select_one()
        assert root3 == d.select_one(dict(name='d'))
        assert None == d.select_one(dict(name='nope'))
        got_error = False
        try:
            d.select_one(dict(name='c'))
        except ValueError as e:
            got_error = True
            assert 'Found more than one' in repr(e)
        assert got_error

        # select_one() on object
        assert None == root3.select_one(dict(name='a'))
        assert child3 == root3.select_one(dict(name='c'))

        # set_select()
        d.set_select(dict(foo=44), dict(name='c'))
        assert set([root2, child3, root3])  == set(d.select(dict(name='c')))

        # set_select() on object
        root3.set_select(dict(name='c'), dict(foo=57))
        assert set([child3, root3]) == set(d.select(dict(foo=57)))
        assert set([child3, root3]) == set(root3.select(dict(foo=57)))

    def test_is_single_string_selector(self):
        d = document.Document()
        # this is an implementation detail but just ensuring it works
        assert d._is_single_string_selector(dict(foo='c'), 'foo')
        assert d._is_single_string_selector(dict(foo=u'c'), 'foo')
        assert not d._is_single_string_selector(dict(foo='c', bar='d'), 'foo')
        assert not d._is_single_string_selector(dict(foo=42), 'foo')

    def test_all_models_with_multiple_references(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        root1 = SomeModelInTestDocument()
        root2 = SomeModelInTestDocument()
        child1 = AnotherModelInTestDocument()
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
        root1 = SomeModelInTestDocument()
        root2 = SomeModelInTestDocument()
        child1 = SomeModelInTestDocument()
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

        print("Removing root1")
        d.remove_root(root1)
        assert len(d._all_models) == 1
        print("Removing root2")
        d.remove_root(root2)
        assert len(d._all_models) == 0

    def test_change_notification(self):
        d = document.Document()
        assert not d.roots
        m = AnotherModelInTestDocument()
        d.add_root(m)
        assert len(d.roots) == 1
        assert m.bar == 1
        assert curdoc() is not d
        events = []
        curdoc_from_listener = []
        def listener(event):
            curdoc_from_listener.append(curdoc())
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
        assert len(curdoc_from_listener) == 1
        assert curdoc_from_listener[0] is d

    def test_change_notification_removal(self):
        d = document.Document()
        assert not d.roots
        m = AnotherModelInTestDocument()
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

        m = AnotherModelInTestDocument(bar=1)
        d.add_root(m)
        assert len(d.roots) == 1
        assert len(events) == 1
        assert isinstance(events[0], document.RootAddedEvent)
        assert events[0].model == m
        m2 = AnotherModelInTestDocument(bar=2)
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

    def test_notification_of_title(self):
        d = document.Document()
        assert not d.roots
        assert d.title == document.DEFAULT_TITLE

        events = []
        def listener(event):
            events.append(event)
        d.on_change(listener)

        d.title = "Foo"
        assert d.title == "Foo"
        assert len(events) == 1
        assert isinstance(events[0], document.TitleChangedEvent)
        assert events[0].document is d
        assert events[0].title == "Foo"

    def test_add_remove_periodic_callback(self):
        d = document.Document()

        events = []
        def listener(event):
            events.append(event)
        d.on_change(listener)

        assert len(d.session_callbacks) == 0
        assert not events

        def cb(): pass

        callback = d.add_periodic_callback(cb, 1, 'abc')
        assert len(d.session_callbacks) == len(events) == 1
        assert isinstance(events[0], document.SessionCallbackAdded)
        assert callback == d.session_callbacks[0] == events[0].callback
        assert callback.id == 'abc'
        assert callback.period == 1

        callback = d.remove_periodic_callback(cb)
        assert len(d.session_callbacks) == 0
        assert len(events) == 2
        assert isinstance(events[0], document.SessionCallbackAdded)
        assert isinstance(events[1], document.SessionCallbackRemoved)

    def test_add_remove_timeout_callback(self):
        d = document.Document()

        events = []
        def listener(event):
            events.append(event)
        d.on_change(listener)

        assert len(d.session_callbacks) == 0
        assert not events

        def cb(): pass

        callback = d.add_timeout_callback(cb, 1, 'abc')
        assert len(d.session_callbacks) == len(events) == 1
        assert isinstance(events[0], document.SessionCallbackAdded)
        assert callback == d.session_callbacks[0] == events[0].callback
        assert callback.id == 'abc'
        assert callback.timeout == 1

        callback = d.remove_timeout_callback(cb)
        assert len(d.session_callbacks) == 0
        assert len(events) == 2
        assert isinstance(events[0], document.SessionCallbackAdded)
        assert isinstance(events[1], document.SessionCallbackRemoved)

    def test_periodic_callback_gets_curdoc(self):
        d = document.Document()
        assert curdoc() is not d
        curdoc_from_cb = []
        def cb():
            curdoc_from_cb.append(curdoc())
        callback = d.add_periodic_callback(cb, 1)
        callback.callback()
        assert len(curdoc_from_cb) == 1
        assert curdoc_from_cb[0] is d

    def test_timeout_callback_gets_curdoc(self):
        d = document.Document()
        assert curdoc() is not d
        curdoc_from_cb = []
        def cb():
            curdoc_from_cb.append(curdoc())
        callback = d.add_timeout_callback(cb, 1)
        callback.callback()
        assert len(curdoc_from_cb) == 1
        assert curdoc_from_cb[0] is d

    def test_model_callback_gets_curdoc(self):
        d = document.Document()
        m = AnotherModelInTestDocument(bar=42)
        d.add_root(m)
        assert curdoc() is not d
        curdoc_from_cb = []
        def cb(attr, old, new):
            curdoc_from_cb.append(curdoc())
        m.on_change('bar', cb)
        m.bar = 43
        assert len(curdoc_from_cb) == 1
        assert curdoc_from_cb[0] is d

    def test_clear(self):
        d = document.Document()
        assert not d.roots
        assert d.title == document.DEFAULT_TITLE
        d.add_root(AnotherModelInTestDocument())
        d.add_root(AnotherModelInTestDocument())
        d.title = "Foo"
        assert len(d.roots) == 2
        assert d.title == "Foo"
        d.clear()
        assert not d.roots
        assert not d._all_models
        assert d.title == "Foo" # do not reset title

    def test_serialization_one_model(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        root1 = SomeModelInTestDocument()
        d.add_root(root1)
        d.title = "Foo"

        json = d.to_json_string()
        copy = document.Document.from_json_string(json)

        assert len(copy.roots) == 1
        assert copy.title == "Foo"

    def test_serialization_more_models(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        root1 = SomeModelInTestDocument(foo=42)
        root2 = SomeModelInTestDocument(foo=43)
        child1 = SomeModelInTestDocument(foo=44)
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

    def test_serialization_has_version(self):
        from bokeh import __version__
        d = document.Document()
        json = d.to_json()
        assert json['version'] == __version__

    def test_patch_integer_property(self):
        d = document.Document()
        assert not d.roots
        assert len(d._all_models) == 0
        root1 = SomeModelInTestDocument(foo=42)
        root2 = SomeModelInTestDocument(foo=43)
        child1 = SomeModelInTestDocument(foo=44)
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
        root1 = SomeModelInTestDocument(foo=42)
        root2 = SomeModelInTestDocument(foo=43)
        child1 = SomeModelInTestDocument(foo=44)
        child2 = SomeModelInTestDocument(foo=45)
        child3 = SomeModelInTestDocument(foo=46, child=child2)
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
        root1 = SomeModelInTestDocument(foo=42)
        child1 = SomeModelInTestDocument(foo=43)
        root1.child = child1
        d.add_root(root1)
        assert len(d.roots) == 1
        assert root1.child == child1
        assert root1.foo == 42
        assert root1.child.foo == 43

        child2 = SomeModelInTestDocument(foo=44)

        event1 = document.ModelChangedEvent(d, root1, 'foo', root1.foo, 57)
        event2 = document.ModelChangedEvent(d, root1, 'child', root1.child, child2)
        patch1 = d.create_json_patch_string([event1, event2])
        d.apply_json_patch_string(patch1)

        assert root1.foo == 57
        assert root1.child.foo == 44

    # a more realistic set of models instead of fake models
    def test_scatter(self):
        from bokeh.io import set_curdoc
        from bokeh.plotting import figure
        import numpy as np
        d = document.Document()
        set_curdoc(d)
        assert not d.roots
        assert len(d._all_models) == 0
        p1 = figure(tools=[])
        N = 10
        x = np.linspace(0, 4*np.pi, N)
        y = np.sin(x)
        p1.scatter(x,y, color="#FF00FF", nonselection_fill_color="#FFFF00", nonselection_fill_alpha=1)
        assert len(d.roots) == 1

    # TODO test serialize/deserialize with list-and-dict-valued properties

    # TODO test replace_with_json
