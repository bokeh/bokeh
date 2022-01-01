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
import gc

# External imports
from mock import MagicMock, patch

# Bokeh imports
from bokeh.document import Document
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

        m = Div(id="foo")

        dm["foo"] = m
        assert len(dm) == 1

        assert dm["foo"] is m

        with pytest.raises(KeyError):
            dm["junk"]

    def test_contains(self) -> None:
        d = Document()
        dm = bdm.DocumentModelManager(d)
        assert len(dm) == 0

        m = Div(id="foo")

        dm["foo"] = m

        assert "foo" in dm
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

        m1 = Div(id="m1")
        m2 = Div(id="m2")

        d.add_root(m1)
        d.add_root(m2)

        assert dm.get_by_id("m1") is m1
        assert dm.get_by_id("m2") is m2
        assert dm.get_by_id("junk") is None

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

        r1 = Row(children=[Div(id="d1", name="dr1")])
        r2 = Row(children=[Div(id="d2", name="dr2"), Div(id="d3", name="dr2")])

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

        m1 = Div(id="m1")
        m2 = Div(id="m2")

        d.add_root(m1)
        d.add_root(m2)

        assert not dm.seen("m1")
        assert not dm.seen("m2")

        d.remove_root(m2)

        assert not dm.seen("m1")
        assert dm.seen("m2")

        d.remove_root(m1)

        assert dm.seen("m1")
        assert dm.seen("m2")

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

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
