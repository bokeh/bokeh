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

# Standard library imports
import weakref
from typing import Any

# External imports
from mock import patch

# Bokeh imports
from bokeh.core.enums import HoldPolicy
from bokeh.core.has_props import ModelDef, OverrideDef, PropertyDef
from bokeh.core.properties import (
    Instance,
    Int,
    List,
    Nullable,
    Override,
)
from bokeh.core.property.vectorization import Field, Value
from bokeh.core.serialization import (
    Deserializer,
    MapRep,
    ObjectRefRep,
    Ref,
)
from bokeh.core.types import ID
from bokeh.document.events import (
    ColumnsPatchedEvent,
    ColumnsStreamedEvent,
    ModelChangedEvent,
    RootAddedEvent,
    RootRemovedEvent,
    SessionCallbackAdded,
    SessionCallbackRemoved,
    TitleChangedEvent,
)
from bokeh.document.json import ModelChanged, PatchJson
from bokeh.io.doc import curdoc
from bokeh.model import DataModel
from bokeh.models import ColumnDataSource
from bokeh.protocol.messages.patch_doc import patch_doc
from bokeh.server.contexts import BokehSessionContext
from bokeh.util.logconfig import basicConfig

from _util_document import (
    AnotherModelInTestDocument,
    ModelThatOverridesName,
    ModelWithSpecInTestDocument,
    SomeModelInTestDocument,
)

# Module under test
import bokeh.document.document as document # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class SomeDataModel(DataModel):
    prop0 = Int()
    prop1 = Int(default=111)
    prop2 = List(Int, default=[1, 2, 3])

class DerivedDataModel(SomeDataModel):
    prop3 = Int()
    prop4 = Int(default=112)
    prop5 = List(Int, default=[1, 2, 3, 4])
    prop6 = Instance(SomeDataModel)
    prop7 = Nullable(Instance(SomeDataModel))

    prop2 = Override(default=[4, 5, 6])

class CDSDerivedDataModel(ColumnDataSource, DataModel):
    prop0 = Int()
    prop1 = Int(default=111)
    prop2 = List(Int, default=[1, 2, 3])

    data = Override(default={"default_column": [4, 5, 6]})

class CDSDerivedDerivedDataModel(CDSDerivedDataModel):
    prop3 = Instance(SomeDataModel, default=SomeDataModel(prop0=-1))

    data = Override(default={"default_column": [7, 8, 9]})

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestDocumentHold:
    @pytest.mark.parametrize('policy', HoldPolicy)
    @patch("bokeh.document.callbacks.DocumentCallbackManager.hold")
    def test_hold(self, mock_hold, policy) -> None:
        d = document.Document()
        d.hold(policy)
        assert mock_hold.called
        assert mock_hold.call_args[0] == (policy,)
        assert mock_hold.call_args[1] == {}

    @patch("bokeh.document.callbacks.DocumentCallbackManager.unhold")
    def test_unhold(self, mock_unhold) -> None:
        d = document.Document()
        d.unhold()
        assert mock_unhold.called
        assert mock_unhold.call_args[0] == ()
        assert mock_unhold.call_args[1] == {}

class TestDocument:
    def test_basic(self) -> None:
        d = document.Document()
        assert not d.roots
        assert d.template_variables == {}
        assert d.session_context is None

    def test_session_context(self) -> None:
        d = document.Document()
        assert d.session_context is None

        sc = BokehSessionContext(None, None, d)
        d._session_context = weakref.ref(sc)
        assert d.session_context is sc

    def test_add_roots(self) -> None:
        d = document.Document()
        assert not d.roots
        d.add_root(AnotherModelInTestDocument())
        assert len(d.roots) == 1
        assert next(iter(d.roots)).document == d

    def test_roots_preserves_insertion_order(self) -> None:
        d = document.Document()
        assert not d.roots
        roots = [
            AnotherModelInTestDocument(),
            AnotherModelInTestDocument(),
            AnotherModelInTestDocument(),
        ]
        for r in roots:
            d.add_root(r)
        assert len(d.roots) == 3
        assert type(d.roots) is list
        roots_iter = iter(d.roots)
        assert next(roots_iter) is roots[0]
        assert next(roots_iter) is roots[1]
        assert next(roots_iter) is roots[2]

    def test_title(self) -> None:
        d = document.Document()
        assert d.title == document.DEFAULT_TITLE
        d.title = "Foo"
        assert d.title == "Foo"

    def test_all_models(self) -> None:
        d = document.Document()
        assert not d.roots
        assert len(d.models) == 0
        m = SomeModelInTestDocument()
        m2 = AnotherModelInTestDocument()
        m.child = m2
        d.add_root(m)
        assert len(d.roots) == 1
        assert len(d.models) == 2
        m.child = None
        assert len(d.models) == 1
        m.child = m2
        assert len(d.models) == 2
        d.remove_root(m)
        assert len(d.models) == 0

    def test_get_model_by_id(self) -> None:
        d = document.Document()
        assert not d.roots
        assert len(d.models) == 0
        m = SomeModelInTestDocument()
        m2 = AnotherModelInTestDocument()
        m.child = m2
        d.add_root(m)
        assert len(d.roots) == 1
        assert len(d.models) == 2
        assert d.get_model_by_id(m.id) == m
        assert d.get_model_by_id(m2.id) == m2
        assert d.get_model_by_id("not a valid ID") is None

    def test_get_model_by_name(self) -> None:
        d = document.Document()
        assert not d.roots
        assert len(d.models) == 0
        m = SomeModelInTestDocument(name="foo")
        m2 = AnotherModelInTestDocument(name="bar")
        m.child = m2
        d.add_root(m)
        assert len(d.roots) == 1
        assert len(d.models) == 2
        assert d.get_model_by_name(m.name) == m
        assert d.get_model_by_name(m2.name) == m2
        assert d.get_model_by_name("not a valid name") is None

    def test_get_model_by_changed_name(self) -> None:
        d = document.Document()
        m = SomeModelInTestDocument(name="foo")
        d.add_root(m)
        assert d.get_model_by_name("foo") == m
        m.name = "bar"
        assert d.get_model_by_name("foo") is None
        assert d.get_model_by_name("bar") == m

    def test_get_model_by_changed_from_none_name(self) -> None:
        d = document.Document()
        m = SomeModelInTestDocument(name=None)
        d.add_root(m)
        assert d.get_model_by_name("bar") is None
        m.name = "bar"
        assert d.get_model_by_name("bar") == m

    def test_get_model_by_changed_to_none_name(self) -> None:
        d = document.Document()
        m = SomeModelInTestDocument(name="bar")
        d.add_root(m)
        assert d.get_model_by_name("bar") == m
        m.name = None
        assert d.get_model_by_name("bar") is None

    def test_can_get_name_overriding_model_by_name(self) -> None:
        d = document.Document()
        m = ModelThatOverridesName(name="foo")
        d.add_root(m)
        assert d.get_model_by_name("foo") == m
        m.name = "bar"
        assert d.get_model_by_name("bar") == m

    def test_cannot_get_model_with_duplicate_name(self) -> None:
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

    def test_select(self) -> None:
        # we aren't trying to replace test_query here, only test
        # our wrappers around it, so no need to try every kind of
        # query
        d = document.Document()
        root1 = SomeModelInTestDocument(foo=42, name='a')
        child1 = SomeModelInTestDocument(foo=43, name='b')
        root2 = SomeModelInTestDocument(foo=44, name='c')
        root3 = SomeModelInTestDocument(foo=44, name='d')
        child3 = SomeModelInTestDocument(foo=45, name='c')
        root4 = AnotherModelInTestDocument(bar=20, name='A')
        root1.child = child1
        root3.child = child3
        d.add_root(root1)
        d.add_root(root2)
        d.add_root(root3)
        d.add_root(root4)

        # select()
        assert {root1} == set(d.select(dict(foo=42)))
        assert {root1} == set(d.select(dict(name="a")))
        assert {root2, child3} == set(d.select(dict(name="c")))
        assert set() == set(d.select(dict(name="nope")))

        # select() on object
        assert set() == set(root3.select(dict(name="a")))
        assert {child3} == set(root3.select(dict(name="c")))

        # select_one()
        assert root3 == d.select_one(dict(name='d'))
        assert d.select_one(dict(name='nope')) is None
        got_error = False
        try:
            d.select_one(dict(name='c'))
        except ValueError as e:
            got_error = True
            assert 'Found more than one' in repr(e)
        assert got_error

        # select_one() on object
        assert root3.select_one(dict(name='a')) is None
        assert child3 == root3.select_one(dict(name='c'))

        # set_select()
        d.set_select(dict(foo=44), dict(name="c"))
        assert {root2, child3, root3} == set(d.select(dict(name="c")))

        # set_select() on object
        root3.set_select(dict(name='c'), dict(foo=57))
        assert {child3, root3} == set(d.select(dict(foo=57)))
        assert {child3, root3} == set(root3.select(dict(foo=57)))

        # set_select() on class
        d.set_select(SomeModelInTestDocument, dict(name='new_name'))
        assert len(d.select(dict(name='new_name'))) == 5

        # set_select() on different class
        assert len(d.select(dict(name="A"))) == 1
        d.set_select(AnotherModelInTestDocument, dict(name="B"))
        assert {root4} == set(d.select(dict(name="B")))

    def test_all_models_with_multiple_references(self) -> None:
        d = document.Document()
        assert not d.roots
        assert len(d.models) == 0
        root1 = SomeModelInTestDocument()
        root2 = SomeModelInTestDocument()
        child1 = AnotherModelInTestDocument()
        root1.child = child1
        root2.child = child1
        d.add_root(root1)
        d.add_root(root2)
        assert len(d.roots) == 2
        assert len(d.models) == 3
        root1.child = None
        assert len(d.models) == 3
        root2.child = None
        assert len(d.models) == 2
        root1.child = child1
        assert len(d.models) == 3
        root2.child = child1
        assert len(d.models) == 3
        d.remove_root(root1)
        assert len(d.models) == 2
        d.remove_root(root2)
        assert len(d.models) == 0

    def test_all_models_with_cycles(self) -> None:
        d = document.Document()
        assert not d.roots
        assert len(d.models) == 0
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
        assert len(d.models) == 3
        print("clearing child of root1")
        root1.child = None
        assert len(d.models) == 3
        print("clearing child of root2")
        root2.child = None
        assert len(d.models) == 2
        print("putting child1 back in root1")
        root1.child = child1
        assert len(d.models) == 3

        print("Removing root1")
        d.remove_root(root1)
        assert len(d.models) == 1
        print("Removing root2")
        d.remove_root(root2)
        assert len(d.models) == 0

    def test_change_notification(self) -> None:
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
        assert isinstance(event, ModelChangedEvent)
        assert event.document == d
        assert event.model == m
        assert event.attr == 'bar'
        assert event.new == 42
        assert len(curdoc_from_listener) == 1
        assert curdoc_from_listener[0] is d

    def test_stream_notification(self) -> None:
        d = document.Document()
        assert not d.roots
        m = ColumnDataSource(data=dict(a=[10], b=[20]))
        d.add_root(m)
        assert len(d.roots) == 1
        assert curdoc() is not d
        events = []
        curdoc_from_listener = []
        def listener(event):
            curdoc_from_listener.append(curdoc())
            events.append(event)
        d.on_change(listener)
        m.stream(dict(a=[11, 12], b=[21, 22]), 200)
        assert events
        event = events[0]
        assert isinstance(event, ColumnsStreamedEvent)
        assert event.document == d
        assert event.model == m
        assert event.attr == "data"
        assert event.data == dict(a=[11, 12], b=[21, 22])
        assert event.rollover == 200
        assert len(curdoc_from_listener) == 1
        assert curdoc_from_listener[0] is d

    def test_patch_notification(self) -> None:
        d = document.Document()
        assert not d.roots
        m = ColumnDataSource(data=dict(a=[10,11], b=[20,21]))
        d.add_root(m)
        assert len(d.roots) == 1
        assert curdoc() is not d
        events = []
        curdoc_from_listener = []
        def listener(event):
            curdoc_from_listener.append(curdoc())
            events.append(event)
        d.on_change(listener)
        m.patch(dict(a=[(0, 1)], b=[(0,0), (1,1)]))
        assert events
        event = events[0]
        assert isinstance(event, ColumnsPatchedEvent)
        assert event.document == d
        assert event.model == m
        assert event.attr == "data"
        assert event.patches == dict(a=[(0, 1)], b=[(0,0), (1,1)])
        assert len(curdoc_from_listener) == 1
        assert curdoc_from_listener[0] is d


    def test_change_notification_removal(self) -> None:
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

    def test_notification_of_roots(self) -> None:
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
        assert isinstance(events[0], RootAddedEvent)
        assert events[0].model == m
        m2 = AnotherModelInTestDocument(bar=2)
        d.add_root(m2)
        assert len(d.roots) == 2
        assert len(events) == 2
        assert isinstance(events[1], RootAddedEvent)
        assert events[1].model == m2

        d.remove_root(m)
        assert len(d.roots) == 1
        assert len(events) == 3
        assert isinstance(events[2], RootRemovedEvent)
        assert events[2].model == m

        d.remove_root(m2)
        assert len(d.roots) == 0
        assert len(events) == 4
        assert isinstance(events[3], RootRemovedEvent)
        assert events[3].model == m2

    def test_notification_of_title(self) -> None:
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
        assert isinstance(events[0], TitleChangedEvent)
        assert events[0].document is d
        assert events[0].title == "Foo"

    def test_add_remove_periodic_callback(self) -> None:
        d = document.Document()

        events = []
        def listener(event):
            events.append(event)
        d.on_change(listener)

        assert len(d.session_callbacks) == 0
        assert not events

        def cb(): pass

        callback_obj = d.add_periodic_callback(cb, 1)
        assert len(d.session_callbacks) == len(events) == 1
        assert isinstance(events[0], SessionCallbackAdded)
        assert callback_obj == d.session_callbacks[0] == events[0].callback
        assert callback_obj.period == 1

        d.remove_periodic_callback(callback_obj)
        assert len(d.session_callbacks) == 0
        assert len(events) == 2
        assert isinstance(events[0], SessionCallbackAdded)
        assert isinstance(events[1], SessionCallbackRemoved)

    def test_add_remove_timeout_callback(self) -> None:
        d = document.Document()

        events = []
        def listener(event):
            events.append(event)
        d.on_change(listener)

        assert len(d.session_callbacks) == 0
        assert not events

        def cb(): pass

        callback_obj = d.add_timeout_callback(cb, 1)
        assert len(d.session_callbacks) == len(events) == 1
        assert isinstance(events[0], SessionCallbackAdded)
        assert callback_obj == d.session_callbacks[0] == events[0].callback
        assert callback_obj.timeout == 1

        d.remove_timeout_callback(callback_obj)
        assert len(d.session_callbacks) == 0
        assert len(events) == 2
        assert isinstance(events[0], SessionCallbackAdded)
        assert isinstance(events[1], SessionCallbackRemoved)

    def test_add_partial_callback(self) -> None:
        from functools import partial
        d = document.Document()

        events = []
        def listener(event):
            events.append(event)
        d.on_change(listener)

        assert len(d.session_callbacks) == 0
        assert not events

        def _cb(): pass
        cb = partial(_cb)

        callback_obj = d.add_timeout_callback(cb, 1)
        assert len(d.session_callbacks) == len(events) == 1
        assert isinstance(events[0], SessionCallbackAdded)
        assert callback_obj == d.session_callbacks[0] == events[0].callback
        assert callback_obj.timeout == 1

    def test_add_remove_next_tick_callback(self) -> None:
        d = document.Document()

        events = []
        def listener(event):
            events.append(event)
        d.on_change(listener)

        assert len(d.session_callbacks) == 0
        assert not events

        def cb(): pass

        callback_obj = d.add_next_tick_callback(cb)
        assert len(d.session_callbacks) == len(events) == 1
        assert isinstance(events[0], SessionCallbackAdded)
        assert callback_obj == d.session_callbacks[0] == events[0].callback

        d.remove_next_tick_callback(callback_obj)
        assert len(d.session_callbacks) == 0
        assert len(events) == 2
        assert isinstance(events[0], SessionCallbackAdded)
        assert isinstance(events[1], SessionCallbackRemoved)

    def test_periodic_callback_gets_curdoc(self) -> None:
        d = document.Document()
        assert curdoc() is not d
        curdoc_from_cb = []
        def cb():
            curdoc_from_cb.append(curdoc())
        callback_obj = d.add_periodic_callback(cb, 1)
        callback_obj.callback()
        assert len(curdoc_from_cb) == 1
        assert curdoc_from_cb[0] is d

    def test_timeout_callback_gets_curdoc(self) -> None:
        d = document.Document()
        assert curdoc() is not d
        curdoc_from_cb = []
        def cb():
            curdoc_from_cb.append(curdoc())
        callback_obj = d.add_timeout_callback(cb, 1)
        callback_obj.callback()
        assert len(curdoc_from_cb) == 1
        assert curdoc_from_cb[0] is d

    def test_next_tick_callback_gets_curdoc(self) -> None:
        d = document.Document()
        assert curdoc() is not d
        curdoc_from_cb = []
        def cb():
            curdoc_from_cb.append(curdoc())
        callback_obj = d.add_next_tick_callback(cb)
        callback_obj.callback()
        assert len(curdoc_from_cb) == 1
        assert curdoc_from_cb[0] is d

    def test_model_callback_gets_curdoc(self) -> None:
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

    def test_clear(self) -> None:
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
        assert len(d.models) == 0
        assert d.title == "Foo" # do not reset title

    def test_serialization_one_model(self) -> None:
        d = document.Document()
        assert not d.roots
        assert len(d.models) == 0
        root1 = SomeModelInTestDocument()
        d.add_root(root1)
        d.title = "Foo"

        json = d.to_json()
        copy = document.Document.from_json(json)

        assert len(copy.roots) == 1
        assert copy.title == "Foo"

    def test_serialization_more_models(self) -> None:
        d = document.Document()
        assert not d.roots
        assert len(d.models) == 0
        root1 = SomeModelInTestDocument(foo=42)
        root2 = SomeModelInTestDocument(foo=43)
        child1 = SomeModelInTestDocument(foo=44)
        root1.child = child1
        root2.child = child1
        d.add_root(root1)
        d.add_root(root2)
        assert len(d.roots) == 2

        json = d.to_json()
        copy = document.Document.from_json(json)

        assert len(copy.roots) == 2
        foos = []
        for r in copy.roots:
            foos.append(r.foo)
        foos.sort()
        assert [42,43] == foos

        some_root = next(iter(copy.roots))
        assert some_root.child.foo == 44

    def test_serialization_data_models(self) -> None:
        #obj0 = SomeDataModel()
        #obj1 = DerivedDataModel(prop6=obj0)
        #obj2 = CDSDerivedDataModel()
        #obj3 = CDSDerivedDerivedDataModel()

        doc = document.Document()
        #doc.add_root(obj0)
        #doc.add_root(obj1)
        #doc.add_root(obj2)
        #doc.add_root(obj3)

        json = doc.to_json()
        assert json["defs"] == [
            ModelDef(
                type="model",
                name="test_document.SomeDataModel",
                properties=[
                    PropertyDef(name="prop0", kind="Any", default=0),
                    PropertyDef(name="prop1", kind="Any", default=111),
                    PropertyDef(name="prop2", kind="Any", default=[1, 2, 3]),
                ],
            ),
            ModelDef(
                type="model",
                name="test_document.DerivedDataModel",
                extends=Ref(id=ID("test_document.SomeDataModel")),
                properties=[
                    PropertyDef(name="prop3", kind="Any", default=0),
                    PropertyDef(name="prop4", kind="Any", default=112),
                    PropertyDef(name="prop5", kind="Any", default=[1, 2, 3, 4]),
                    PropertyDef(name="prop6", kind="Any"),
                    PropertyDef(name="prop7", kind="Any", default=None),
                ],
                overrides=[
                    OverrideDef(name="prop2", default=[4, 5, 6]),
                ],
            ),
            ModelDef(
                type="model",
                name="test_document.CDSDerivedDataModel",
                extends=Ref(id=ID("ColumnDataSource")),
                properties=[
                    PropertyDef(name="prop0", kind="Any", default=0),
                    PropertyDef(name="prop1", kind="Any", default=111),
                    PropertyDef(name="prop2", kind="Any", default=[1, 2, 3]),
                ],
                overrides=[
                    OverrideDef(name="data", default=MapRep(type="map", entries=[("default_column", [4, 5, 6])])),
                ],
            ),
            ModelDef(
                type="model",
                name="test_document.CDSDerivedDerivedDataModel",
                extends=Ref(id=ID("test_document.CDSDerivedDataModel")),
                properties=[
                    PropertyDef(
                        name="prop3",
                        kind="Any",
                        default=ObjectRefRep(
                            type="object",
                            name="test_document.SomeDataModel",
                            id=CDSDerivedDerivedDataModel.prop3.property._default.ref["id"],
                            attributes=dict(prop0=-1),
                        ),
                    ),
                ],
                overrides=[
                    OverrideDef(name="data", default=MapRep(type="map", entries=[("default_column", [7, 8, 9])])),
                ],
            ),
        ]
        # TODO: assert json["roots"]["references"] == ...

    def test_serialization_has_version(self) -> None:
        from bokeh import __version__
        d = document.Document()
        json = d.to_json()
        assert json['version'] == __version__

    def test_patch_integer_property(self) -> None:
        d = document.Document()
        assert not d.roots
        assert len(d.models) == 0
        root1 = SomeModelInTestDocument(foo=42)
        root2 = SomeModelInTestDocument(foo=43)
        child1 = SomeModelInTestDocument(foo=44)
        root1.child = child1
        root2.child = child1
        d.add_root(root1)
        d.add_root(root2)
        assert len(d.roots) == 2

        event1 = ModelChangedEvent(d, root1, 'foo', 57)
        patch1 = patch_doc.create([event1]).content
        d.apply_json_patch(patch1)

        assert root1.foo == 57

        event2 = ModelChangedEvent(d, child1, 'foo', 67)
        patch2 = patch_doc.create([event2]).content
        d.apply_json_patch(patch2)

        assert child1.foo == 67

    def test_patch_spec_property(self) -> None:
        d = document.Document()
        assert not d.roots
        assert len(d.models) == 0
        root1 = ModelWithSpecInTestDocument(foo=42)
        d.add_root(root1)
        assert len(d.roots) == 1

        def patch_test(new_value: Any):
            event1 = ModelChangedEvent(d, root1, 'foo', new_value)
            patch1 = patch_doc.create([event1]).content
            d.apply_json_patch(patch1)
            if isinstance(new_value, dict):
                return root1.lookup('foo').get_value(root1)
            else:
                return root1.foo
        assert patch_test(57) == 57
        assert 'data' == root1.foo_units
        assert patch_test(dict(value=58)) == Value(58)
        assert 'data' == root1.foo_units

        assert patch_test(dict(value=58, units='screen')) == Value(58, units='screen')
        assert 'screen' == root1.foo_units
        assert patch_test(dict(value=59, units='screen')) == Value(59, units='screen')
        assert 'screen' == root1.foo_units

        assert patch_test(dict(value=59, units='data')) == Value(59)
        assert 'data' == root1.foo_units
        assert patch_test(dict(value=60, units='data')) == Value(60)
        assert 'data' == root1.foo_units
        assert patch_test(dict(value=60, units='data')) == Value(60)
        assert 'data' == root1.foo_units

        assert patch_test(61) == 61
        assert 'data' == root1.foo_units
        root1.foo = "a_string" # so "woot" gets set as a string
        assert patch_test("woot") == "woot"
        assert 'data' == root1.foo_units
        assert patch_test(dict(field="woot2")) == Field("woot2")
        assert 'data' == root1.foo_units
        assert patch_test(dict(field="woot2", units='screen')) == Field("woot2", units='screen')
        assert 'screen' == root1.foo_units
        assert patch_test(dict(field="woot3")) == Field("woot3", units="screen")
        assert 'screen' == root1.foo_units
        assert patch_test(dict(value=70)) == Value(70, units="screen")
        assert 'screen' == root1.foo_units
        root1.foo = 123 # so 71 gets set as a number
        assert patch_test(71) == 71
        assert 'screen' == root1.foo_units

    def test_patch_reference_property(self) -> None:
        d = document.Document()
        assert not d.roots
        assert len(d.models) == 0
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

        assert child1.id in d.models
        assert child2.id not in d.models
        assert child3.id not in d.models

        event1 = ModelChangedEvent(d, root1, 'child', child3)
        patch1 = patch_doc.create([event1]).content
        d.apply_json_patch(patch1)

        assert root1.child.id == child3.id
        assert root1.child.child.id == child2.id
        assert child1.id in d.models
        assert child2.id in d.models
        assert child3.id in d.models

        # put it back how it was before
        event2 = ModelChangedEvent(d, root1, 'child', child1)
        patch2 = patch_doc.create([event2]).content
        d.apply_json_patch(patch2)

        assert root1.child.id == child1.id
        assert root1.child.child is None

        assert child1.id in d.models
        assert child2.id not in d.models
        assert child3.id not in d.models

    def test_patch_two_properties_at_once(self) -> None:
        d = document.Document()
        assert not d.roots
        assert len(d.models) == 0
        root1 = SomeModelInTestDocument(foo=42)
        child1 = SomeModelInTestDocument(foo=43)
        root1.child = child1
        d.add_root(root1)
        assert len(d.roots) == 1
        assert root1.child == child1
        assert root1.foo == 42
        assert root1.child.foo == 43

        child2 = SomeModelInTestDocument(foo=44)

        event1 = ModelChangedEvent(d, root1, 'foo', 57)
        event2 = ModelChangedEvent(d, root1, 'child', child2)
        patch1 = patch_doc.create([event1, event2]).content
        d.apply_json_patch(patch1)

        assert root1.foo == 57
        assert root1.child.foo == 44

    def test_patch_a_reference_with_implicit_reference_set(self) -> None:
        m0 = SomeModelInTestDocument(foo=0, child=None)
        m1 = SomeModelInTestDocument(foo=1, child=m0)
        m2 = SomeModelInTestDocument(foo=2, child=m1)
        m3 = SomeModelInTestDocument(foo=3, child=m2)

        doc = document.Document()
        doc.add_root(m3)

        patch = PatchJson(
            events=[
                ModelChanged(
                    kind="ModelChanged",
                    model=m2.ref,
                    attr="child",
                    new=m0.ref,
                ),
            ],
            references=[], # known models are not included by bokehjs to improve performance (e.g. reduce payload size)
        )

        assert m2.child == m1
        doc.apply_json_patch(patch)
        assert m2.child == m0

    # a more realistic set of models instead of fake models
    def test_scatter(self) -> None:
        import numpy as np

        from bokeh.io.doc import set_curdoc
        from bokeh.plotting import figure
        d = document.Document()
        set_curdoc(d)
        assert not d.roots
        assert len(d.models) == 0
        p1 = figure(tools=[])
        N = 10
        x = np.linspace(0, 4 * np.pi, N)
        y = np.sin(x)
        p1.scatter(x, y, color="#FF00FF", nonselection_fill_color="#FFFF00", nonselection_fill_alpha=1)
        # figure does not automatically add itself to the document
        d.add_root(p1)
        assert len(d.roots) == 1

    def test_event_handles_new_callbacks_in_event_callback(self) -> None:
        from bokeh.models import Button
        d = document.Document()
        button1 = Button(label="1")
        button2 = Button(label="2")
        def clicked_1():
            button2.on_event('button_click', clicked_2)
            d.add_root(button2)
        def clicked_2():
            pass

        button1.on_event('button_click', clicked_1)
        d.add_root(button1)

        decoder = Deserializer(references=[button1])
        event = decoder.decode(dict(
            type="event",
            name="button_click",
            values=dict(model=dict(id=button1.id)),
        ))
        try:
            d.callbacks.trigger_event(event)
        except RuntimeError:
            pytest.fail("trigger_event probably did not copy models before modifying")

    # TODO test serialize/deserialize with list-and-dict-valued properties

    # TODO test replace_with_json

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

# needed for caplog tests to function
basicConfig()
