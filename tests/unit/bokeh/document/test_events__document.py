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
from mock import MagicMock, patch

# Bokeh imports
from bokeh.core.properties import Any, ColumnData, Instance
from bokeh.core.serialization import MapRep, ObjectRefRep, Serializer
from bokeh.document import Document
from bokeh.model import Model

# Module under test
import bokeh.document.events as bde # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class FakeEmptyDispatcher:
    pass

class FakeFullDispatcher:
    def __init__(self) -> None:
        self.called = []

    def _document_changed(self, event):         self.called.append('_document_changed')
    def _document_patched(self, event):         self.called.append('_document_patched')
    def _document_model_changed(self, event):   self.called.append('_document_model_changed')
    def _column_data_changed(self, event):      self.called.append('_column_data_changed')
    def _columns_streamed(self, event):         self.called.append('_columns_streamed')
    def _columns_patched(self, event):          self.called.append('_columns_patched')
    def _session_callback_added(self, event):   self.called.append('_session_callback_added')
    def _session_callback_removed(self, event): self.called.append('_session_callback_removed')

class OtherModel(Model):
    data = ColumnData(Any, Any, default={})

class SomeModel(Model):
    data = ColumnData(Any, Any, default={})
    ref1 = Instance(OtherModel, default=lambda: OtherModel())
    ref2 = Instance(OtherModel, default=lambda: OtherModel())

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# DocumentChangedEvent --------------------------------------------------------


class TestDocumentChangedEvent:
    def test_init(self) -> None:
        doc = Document()
        e = bde.DocumentChangedEvent(doc)
        assert e.document == doc
        assert e.setter is None
        assert e.callback_invoker is None

        doc = Document()
        e = bde.DocumentChangedEvent(doc, "setter")
        assert e.document == doc
        assert e.setter == "setter"
        assert e.callback_invoker is None

        doc = Document()
        e = bde.DocumentChangedEvent(doc, callback_invoker="invoker")
        assert e.document == doc
        assert e.setter is None
        assert e.callback_invoker == "invoker"

        doc = Document()
        e = bde.DocumentChangedEvent(doc, "setter", "invoker")
        assert e.document == doc
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_dispatch(self) -> None:
        doc = Document()
        e = bde.DocumentChangedEvent(doc, "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed']

    def test_combine_ignores_all(self) -> None:
        doc = Document()
        e = bde.DocumentChangedEvent(doc, "setter", "invoker")
        e2 = bde.DocumentChangedEvent(doc, "setter", "invoker")
        assert e.combine(e2) is False

# DocumentPatchedEvent --------------------------------------------------------


class TestDocumentPatchedEvent:
    def test_init(self) -> None:
        doc = Document()
        e = bde.DocumentPatchedEvent(doc, "setter", "invoker")
        assert e.document == doc
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_to_serializable(self) -> None:
        doc = Document()
        s = Serializer()
        e = bde.DocumentPatchedEvent(doc, "setter", "invoker")
        with pytest.raises(NotImplementedError):
            s.encode(e)

    def test_dispatch(self) -> None:
        doc = Document()
        e = bde.DocumentPatchedEvent(doc, "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched']

    def test_combine_ignores_all(self) -> None:
        doc = Document()
        e = bde.DocumentPatchedEvent(doc, "setter", "invoker")
        e2 = bde.DocumentPatchedEvent(doc, "setter", "invoker")
        assert e.combine(e2) is False

# ModelChangedEvent -----------------------------------------------------------


class TestModelChangedEvent:
    def test_init_defaults(self) -> None:
        doc = Document()
        e = bde.ModelChangedEvent(doc, "model", "attr", "new")
        assert e.document == doc
        assert e.setter is None
        assert e.callback_invoker is None
        assert e.model == "model"
        assert e.attr == "attr"
        assert e.new == "new"
        assert e.callback_invoker is None

    def test_kind(self) -> None:
        assert bde.ModelChangedEvent.kind == "ModelChanged"

    # TODO (bev) tests for generate

    def test_dispatch(self) -> None:
        doc = Document()
        e = bde.ModelChangedEvent(doc, "model", "attr", "new")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched', '_document_model_changed']

    def test_combine_ignores_except_title_changd_event(self) -> None:
        doc = Document()
        e = bde.ModelChangedEvent(doc, "model", "attr", "new")
        e2 = bde.DocumentPatchedEvent(doc, "setter", "invoker")
        assert e.combine(e2) is False

    def test_combine_ignores_different_setter(self) -> None:
        doc = Document()
        e = bde.ModelChangedEvent(doc, "model", "attr", "new", "setter")
        e2 = bde.ModelChangedEvent(doc, "model", "attr", "new2", "setter2")
        assert e.combine(e2) is False

    def test_combine_ignores_different_doc(self) -> None:
        doc = Document()
        e = bde.ModelChangedEvent(doc, "model", "attr", "new")
        e2 = bde.ModelChangedEvent("doc2", "model", "attr", "new2")
        assert e.combine(e2) is False

    def test_combine_ignores_different_model(self) -> None:
        doc = Document()
        e = bde.ModelChangedEvent(doc, "model", "attr", "new")
        e2 = bde.ModelChangedEvent(doc, "model2", "attr", "new2")
        assert e.combine(e2) is False

    def test_combine_ignores_different_attr(self) -> None:
        doc = Document()
        e = bde.ModelChangedEvent(doc, "model", "attr", "new")
        e2 = bde.ModelChangedEvent(doc, "model", "attr2", "new2")
        assert e.combine(e2) is False

    def test_combine_with_matching_model_changed_event(self) -> None:
        doc = Document()
        e = bde.ModelChangedEvent(doc, "model", "attr", "new", callback_invoker="invoker")
        e2 = bde.ModelChangedEvent(doc, "model", "attr", "new2", callback_invoker="invoker2")
        assert e.combine(e2) is True
        assert e.new == "new2"
        assert e.callback_invoker == "invoker2"

    @patch("bokeh.document.events.ColumnsStreamedEvent.combine")
    def test_combine_with_defers(self, mock_combine: MagicMock) -> None:
        mock_combine.return_value = False
        doc = Document()
        m = SomeModel()
        e = bde.ColumnsStreamedEvent(doc, m, "data", dict(foo=1), 200, "setter", "invoker")
        e2 = bde.ColumnsStreamedEvent(doc, m, "data", dict(foo=2), 300, "setter", "invoker")
        assert e.combine(e2) is False
        assert mock_combine.call_count == 1
        assert mock_combine.call_args[0] == (e2,)
        assert mock_combine.call_args[1] == {}

# ColumnDataChangedEvent ------------------------------------------------------

class TestColumnDataChangedEvent:
    def test_init(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.ColumnDataChangedEvent(doc, m, "data", None, [1,2], "setter", "invoker")
        assert e.document == doc
        assert e.model == m
        assert e.attr == "data"
        assert e.cols == [1,2]
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_kind(self) -> None:
        assert bde.ColumnDataChangedEvent.kind == "ColumnDataChanged"

    def test_to_serializable(self) -> None:
        doc = Document()
        m = SomeModel(data={"col0": [1], "col1": [1, 2], "col2": [1, 2, 3]})
        e = bde.ColumnDataChangedEvent(doc, m, "data", None, ["col1", "col2"], "setter", "invoker")
        s = Serializer()
        r = s.encode(e)
        assert r == dict(
            kind=e.kind,
            model=m.ref,
            attr="data",
            data=MapRep(type="map", entries=[("col1", [1, 2]), ("col2", [1, 2, 3])]),
            cols=["col1", "col2"],
        )
        assert s.buffers == []

    def test_dispatch(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.ColumnDataChangedEvent(doc, m, "data", None, [1,2], "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched', '_column_data_changed']

    def test_combine_ignores_all(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.ColumnDataChangedEvent(doc, m, "data", None, [1,2], "setter", "invoker")
        e2 = bde.ColumnDataChangedEvent(doc, m, "data", None, [3,4], "setter", "invoker")
        assert e.combine(e2) is False
        assert e.cols == [1,2]

# ColumnsStreamedEvent --------------------------------------------------------

class TestColumnsStreamedEvent:

    def test_init(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.ColumnsStreamedEvent(doc, m, "data", dict(foo=1), 200, "setter", "invoker")
        assert e.document == doc
        assert e.model == m
        assert e.attr == "data"
        assert e.data == dict(foo=1)
        assert e.rollover == 200
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_kind(self) -> None:
        assert bde.ColumnsStreamedEvent.kind == "ColumnsStreamed"

    def test_to_serializable(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.ColumnsStreamedEvent(doc, m, "data", dict(foo=1), 200, "setter", "invoker")
        s = Serializer()
        r = s.encode(e)
        assert r == dict(kind=e.kind, model=m.ref, attr="data", data=MapRep(type="map", entries=[("foo", 1)]), rollover=200)
        assert s.buffers == []

    def test_dispatch(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.ColumnsStreamedEvent(doc, m, "data", dict(foo=1), 200, "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched', '_columns_streamed']

    def test_combine_ignores_all(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.ColumnsStreamedEvent(doc, m, "data", dict(foo=1), 200, "setter", "invoker")
        e2 = bde.ColumnsStreamedEvent(doc, m, "data", dict(foo=2), 300, "setter", "invoker")
        assert e.combine(e2) is False
        assert e.model is m
        assert e.attr == "data"
        assert e.data == dict(foo=1)
        assert e.rollover == 200

    def test_pandas_data(self, pd) -> None:
        doc = Document()
        m = SomeModel()
        df = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
        e = bde.ColumnsStreamedEvent(doc, m, "data", df, 200, "setter", "invoker")
        assert isinstance(e.data, dict)
        assert e.data == {c: df[c] for c in df.columns}

# ColumnsPatchedEvent ---------------------------------------------------------


class TestColumnsPatchedEvent:
    def test_init(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.ColumnsPatchedEvent(doc, m, "data", [1, 2], "setter", "invoker")
        assert e.document == doc
        assert e.model == m
        assert e.attr == "data"
        assert e.patches == [1, 2]
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_kind(self) -> None:
        assert bde.ColumnsPatchedEvent.kind == "ColumnsPatched"

    def test_to_serializable(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.ColumnsPatchedEvent(doc, m, "data", [1, 2], "setter", "invoker")
        s = Serializer()
        r = s.encode(e)
        assert r == dict(kind=e.kind, model=m.ref, attr="data", patches=[1,2])
        assert s.buffers == []

    def test_dispatch(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.ColumnsPatchedEvent(doc, m, "data", [1, 2], "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched', '_columns_patched']

    def test_combine_ignores_all(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.ColumnsPatchedEvent(doc, m, "data", [1,2], "setter", "invoker")
        e2 = bde.ColumnsPatchedEvent(doc, m, "data", [3,4], "setter", "invoker")
        assert e.combine(e2) is False
        assert e.patches == [1,2]

# TitleChangedEvent -----------------------------------------------------------


class TestTitleChangedEvent:
    def test_init(self) -> None:
        doc = Document()
        e = bde.TitleChangedEvent(doc, "title", "setter", "invoker")
        assert e.document == doc
        assert e.title == "title"
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_kind(self) -> None:
        assert bde.TitleChangedEvent.kind == "TitleChanged"

    def test_to_serializable(self) -> None:
        doc = Document()
        e = bde.TitleChangedEvent(doc, "title", "setter", "invoker")
        s = Serializer()
        r = s.encode(e)
        assert r == dict(kind=e.kind, title="title")
        assert s.buffers == []

    def test_dispatch(self) -> None:
        doc = Document()
        e = bde.TitleChangedEvent(doc, "title", "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched']

    def test_combine_ignores_except_title_changd_event(self) -> None:
        doc = Document()
        e = bde.TitleChangedEvent(doc, "title", "setter", "invoker")
        e2 = bde.DocumentPatchedEvent(doc, "setter", "invoker")
        assert e.combine(e2) is False
        assert e.title == "title"
        assert e.callback_invoker == "invoker"

    def test_combine_ignores_different_setter(self) -> None:
        doc = Document()
        e = bde.TitleChangedEvent(doc, "title", "setter", "invoker")
        e2 = bde.TitleChangedEvent(doc, "title2", "setter2", "invoker2")
        assert e.combine(e2) is False
        assert e.title == "title"
        assert e.callback_invoker == "invoker"

    def test_combine_ignores_different_doc(self) -> None:
        doc = Document()
        e = bde.TitleChangedEvent(doc, "title", "setter", "invoker")
        e2 = bde.TitleChangedEvent("doc2", "title2", "setter2", "invoker2")
        assert e.combine(e2) is False
        assert e.title == "title"
        assert e.callback_invoker == "invoker"

    def test_combine_with_title_changed_event(self) -> None:
        doc = Document()
        e = bde.TitleChangedEvent(doc, "title", "setter", "invoker")
        e2 = bde.TitleChangedEvent(doc, "title2", "setter", "invoker2")
        assert e.combine(e2) is True
        assert e.title == "title2"
        assert e.callback_invoker == "invoker2"

# RootAddedEvent --------------------------------------------------------------


class TestRootAddedEvent:
    def test_init(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.RootAddedEvent(doc, m, "setter", "invoker")
        assert e.document == doc
        assert e.model == m
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_kind(self) -> None:
        assert bde.RootAddedEvent.kind == "RootAdded"

    def test_to_serializable(self) -> None:
        doc = Document()
        ref1 = OtherModel()
        ref2 = OtherModel()
        m = SomeModel(ref1=ref1, ref2=ref2)
        e = bde.RootAddedEvent(doc, m, "setter", "invoker")
        s = Serializer()
        r = s.encode(e)
        assert r == dict(
            kind=e.kind,
            model=ObjectRefRep(
                type="object",
                name="test_events__document.SomeModel",
                id=m.id,
                attributes=dict(
                    ref1=ObjectRefRep(
                        type="object",
                        name="test_events__document.OtherModel",
                        id=ref1.id,
                    ),
                    ref2=ObjectRefRep(
                        type="object",
                        name="test_events__document.OtherModel",
                        id=ref2.id,
                    ),
                ),
            ),
        )
        assert s.buffers == []

    def test_dispatch(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.RootAddedEvent(doc, m, "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched']

# RootRemovedEvent ------------------------------------------------------------


class TestRootRemovedEvent:
    def test_init(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.RootRemovedEvent(doc, m, "setter", "invoker")
        assert e.document == doc
        assert e.model == m
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_kind(self) -> None:
        assert bde.RootRemovedEvent.kind == "RootRemoved"

    def test_to_serializable(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.RootRemovedEvent(doc, m, "setter", "invoker")
        s = Serializer()
        r = s.encode(e)
        assert r == dict(kind=e.kind, model=m.ref)
        assert s.buffers == []

    def test_dispatch(self) -> None:
        doc = Document()
        m = SomeModel()
        e = bde.RootRemovedEvent(doc, m, "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched']

# SessionCallbackAdded --------------------------------------------------------


class TestSessionCallbackAdded:
    def test_init(self) -> None:
        doc = Document()
        e = bde.SessionCallbackAdded(doc, "callback")
        assert e.document == doc
        assert e.callback == "callback"
        assert e.setter is None
        assert e.callback_invoker is None

    def test_dispatch(self) -> None:
        doc = Document()
        e = bde.SessionCallbackAdded(doc, "callback")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_session_callback_added']

    def test_combine_ignores_all(self) -> None:
        doc = Document()
        e = bde.SessionCallbackAdded(doc, "setter")
        e2 = bde.SessionCallbackAdded(doc, "setter")
        assert e.combine(e2) is False

# SessionCallbackRemoved ------------------------------------------------------


class TestSessionCallbackRemoved:
    def test_init(self) -> None:
        doc = Document()
        e = bde.SessionCallbackRemoved(doc, "callback")
        assert e.document == doc
        assert e.callback == "callback"
        assert e.setter is None
        assert e.callback_invoker is None

    def test_dispatch(self) -> None:
        doc = Document()
        e = bde.SessionCallbackRemoved(doc, "callback")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_session_callback_removed']

    def test_combine_ignores_all(self) -> None:
        doc = Document()
        e = bde.SessionCallbackAdded(doc, "setter")
        e2 = bde.SessionCallbackAdded(doc, "setter")
        assert e.combine(e2) is False

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
