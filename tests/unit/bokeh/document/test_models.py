#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
import gc
from unittest.mock import MagicMock, patch

# Bokeh imports
from bokeh.core.has_props import Local
from bokeh.core.properties import Instance, Nullable
from bokeh.core.types import ID
from bokeh.document import Document
from bokeh.model import Model
from bokeh.models import Div, Row

# Module under test
import bokeh.document.models as bdm # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestDocumentModelManager:

    def test_basic(self) -> None:
        d = Document()
        dm = bdm.DocumentModelManager(d)
        assert len(dm) == 0

        # module manager should only hold a weak ref
        assert len(gc.get_referrers(d)) == 0

    def test_len(self) -> None:
        d = Document()
        dm = d.models
        assert len(dm) == 0

        r1 = Row(children=[Div()])
        r2 = Row(children=[Div(), Div()])

        d.add_root(r1)
        assert len(dm) == 2

        d.add_root(r2)
        assert len(dm) == 5

        d.remove_root(r1)
        assert len(dm) == 3

        d.remove_root(r2)
        assert len(dm) == 0

    def test_setitem_getitem(self) -> None:
        d = Document()
        dm = bdm.DocumentModelManager(d)
        assert len(dm) == 0

        m = Div()

        dm[m.id] = m
        assert len(dm) == 1

        assert dm[m.id] is m

        with pytest.raises(KeyError):
            dm["junk"]

    def test_contains(self) -> None:
        d = Document()
        dm = bdm.DocumentModelManager(d)
        assert len(dm) == 0

        m = Div()

        dm[m.id] = m

        assert m.id in dm
        assert "junk" not in dm

    def test_iter(self) -> None:
        d = Document()
        dm = bdm.DocumentModelManager(d)
        assert len(dm) == 0

        m1 = Div()
        m2 = Div()
        m3 = Div()

        dm["m1"] = m1
        dm["m2"] = m2
        dm["m3"] = m3

        result = set()
        for m in dm:
            result.add(m)

        assert result == {m1, m2, m3}

    def test_destroy(self) -> None:
        d = Document()
        dm = d.models
        assert len(dm) == 0

        m1 = Div()
        m2 = Div()
        m3 = Div()

        d.add_root(m1)
        d.add_root(m2)
        d.add_root(m3)
        for m in [m1, m2, m3]:
            assert m._document is d

        assert dm.destroy() is None

        assert not hasattr(dm, "_models")
        assert not hasattr(dm, "_models_by_name")

        for m in [m1, m2, m3]:
            assert m._document is None

    @patch("bokeh.document.models.DocumentModelManager.recompute")
    def test_freeze(self, mock_recompute: MagicMock) -> None:
        d = Document()
        dm = bdm.DocumentModelManager(d)

        assert dm._freeze_count == 0

        with dm.freeze():
            assert dm._freeze_count == 1
            assert not mock_recompute.called

            with dm.freeze():
                assert dm._freeze_count == 2
                assert not mock_recompute.called

            assert dm._freeze_count == 1
            assert not mock_recompute.called

        assert dm._freeze_count == 0
        assert mock_recompute.called  # called here

    def test_get_all_by_name(self) -> None:
        d = Document()
        dm = d.models
        assert len(dm) == 0

        m1 = Div(name="foo")
        m2 = Div(name="foo")
        m3 = Div(name="bar")

        d.add_root(m1)
        d.add_root(m2)
        d.add_root(m3)

        assert set(dm.get_all_by_name("foo")) == {m1, m2}
        assert set(dm.get_all_by_name("bar")) == {m3}
        assert set(dm.get_all_by_name("baz")) == set()

    def test_get_all_by_id(self) -> None:
        d = Document()
        dm = d.models
        assert len(dm) == 0

        m1 = Div()
        m2 = Div()

        d.add_root(m1)
        d.add_root(m2)

        assert dm.get_by_id(m1.id) is m1
        assert dm.get_by_id(m2.id) is m2
        assert dm.get_by_id(ID("junk")) is None

    def test_get_one_by_name(self) -> None:
        d = Document()
        dm = d.models
        assert len(dm) == 0

        m1 = Div(name="foo")
        m2 = Div(name="foo")
        m3 = Div(name="bar")

        d.add_root(m1)
        d.add_root(m2)
        d.add_root(m3)

        with pytest.raises(ValueError):
            dm.get_one_by_name("foo")
        assert dm.get_one_by_name("bar") is m3
        assert dm.get_one_by_name("baz") is None

    @patch("bokeh.document.models.DocumentModelManager.recompute")
    def test_invalidate(self, mock_recompute: MagicMock) -> None:
        d = Document()
        dm = bdm.DocumentModelManager(d)

        with dm.freeze():
            dm.invalidate()
            assert not mock_recompute.called

        assert mock_recompute.call_count == 1

        dm.invalidate()
        assert mock_recompute.call_count == 2

    # This is an indeirect test that documents are attached/detached
    def test_recompute(self) -> None:
        d = Document()
        dm = d.models
        assert len(dm) == 0

        r1 = Row(children=[Div(name="dr1")])
        r2 = Row(children=[Div(name="dr2"), Div(name="dr2")])

        d.add_root(r1)
        d.add_root(r2)

        assert set(dm._models_by_name._dict) == {"dr1", "dr2"}

        for m in dm:
            assert m._document is d

        d.remove_root(r1)
        for m in dm:
            assert m._document is d

        assert r1._document is None
        assert r1.children[0]._document is None

        assert set(dm._models_by_name._dict) == {"dr2"}



    def test_seen(self) -> None:
        d = Document()
        dm = d.models
        assert len(dm) == 0

        m1 = Div()
        m2 = Div()

        d.add_root(m1)
        d.add_root(m2)

        assert not dm.seen(m1.id)
        assert not dm.seen(m2.id)

        d.remove_root(m2)

        assert not dm.seen(m1.id)
        assert dm.seen(m2.id)

        d.remove_root(m1)

        assert dm.seen(m1.id)
        assert dm.seen(m2.id)

    def test_update_name(self) -> None:
        d = Document()
        dm = d.models
        assert len(dm) == 0

        m1 = Div(name="foo")
        m2 = Div()
        m3 = Div(name="bar")

        d.add_root(m1)
        d.add_root(m2)
        d.add_root(m3)

        assert set(dm.get_all_by_name("foo")) == {m1}
        assert set(dm.get_all_by_name("bar")) == {m3}

        dm.update_name(m1, "foo", "baz")

        assert set(dm.get_all_by_name("baz")) == {m1}
        assert set(dm.get_all_by_name("foo")) == set()
        assert set(dm.get_all_by_name("bar")) == {m3}

        dm.update_name(m2, None, "baz")
        dm.update_name(m3, "bar", "baz")

        assert set(dm.get_all_by_name("baz")) == {m1, m2, m3}
        assert set(dm.get_all_by_name("foo")) == set()
        assert set(dm.get_all_by_name("bar")) == set()

    def test_flush_synced(self) -> None:
        class SomeModel(Model, Local):
            child = Nullable(Instance(Model), default=None)

        child0 = SomeModel()
        child1 = SomeModel()
        child2 = SomeModel()
        d = Document()
        d.add_root(child0)
        d.add_root(child1)

        assert d.models._new_models == {child0, child1}
        assert d.models.synced_references == set()
        d.models.flush_synced()
        assert d.models._new_models == set()
        assert d.models.synced_references == {child0, child1}

        d.add_root(child2)
        assert d.models._new_models == {child2}
        assert d.models.synced_references == {child0, child1}

        child2.child = child0
        assert d.models._new_models == {child2}
        assert d.models.synced_references == {child0, child1}
        d.models.flush_synced()
        assert d.models._new_models == set()
        assert d.models.synced_references == {child0, child1, child2}

    def test_flush_synced_with_fn(self) -> None:
        class SomeModel(Model, Local):
            child = Nullable(Instance(Model), default=None)

        child0 = SomeModel()
        child1 = SomeModel()
        child2 = SomeModel(child=child0)
        d = Document()
        d.add_root(child0)
        d.add_root(child1)
        d.add_root(child2)

        assert d.models._new_models == {child0, child1, child2}
        assert d.models.synced_references == set()
        d.models.flush_synced(lambda model: model.child is not None)
        assert d.models._new_models == {child2}
        assert d.models.synced_references == {child0, child1}

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
