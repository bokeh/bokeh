import pytest

from mock import patch

import bokeh.document.events as bde


class FakeEmptyDispatcher(object): pass

class FakeFullDispatcher(object):
    def __init__(self):
        self.called = []

    def _document_changed(self, event):         self.called.append('_document_changed')
    def _document_patched(self, event):         self.called.append('_document_patched')
    def _document_model_changed(self, event):   self.called.append('_document_model_changed')
    def _column_data_changed(self, event):      self.called.append('_column_data_changed')
    def _columns_streamed(self, event):         self.called.append('_columns_streamed')
    def _columns_patched(self, event):          self.called.append('_columns_patched')
    def _session_callback_added(self, event):   self.called.append('_session_callback_added')
    def _session_callback_removed(self, event): self.called.append('_session_callback_removed')

class FakeModel(object):
    ref = "ref"
    data = "data"
    def references(self): return dict(ref1=1, ref2=2)

# DocumentChangedEvent --------------------------------------------------------

class TesDocumentChangedEvent(object):

    def test_init(self):
        e = bde.DocumentChangedEvent("doc")
        assert e.document == "doc"
        assert e.setter == None
        assert e.callback_invoker == None

        e = bde.DocumentChangedEvent("doc", "setter")
        assert e.document == "doc"
        assert e.setter == "setter"
        assert e.callback_invoker == None

        e = bde.DocumentChangedEvent("doc", callback_invoker="invoker")
        assert e.document == "doc"
        assert e.setter == None
        assert e.callback_invoker == "invoker"

        e = bde.DocumentChangedEvent("doc", "setter", "invoker")
        assert e.document == "doc"
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_dispatch(self):
        e = bde.DocumentChangedEvent("doc", "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed']

# DocumentPatchedEvent --------------------------------------------------------

class TestDocumentPatchedEvent(object):

    def test_init(self):
        e = bde.DocumentPatchedEvent("doc", "setter", "invoker")
        assert e.document == "doc"
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_generate(self):
        e = bde.DocumentPatchedEvent("doc", "setter", "invoker")
        with pytest.raises(NotImplementedError):
            e.generate("refs", "bufs")

    def test_dispatch(self):
        e = bde.DocumentPatchedEvent("doc", "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched']

# ModelChangedEvent -----------------------------------------------------------

class TestModelChangedEvent(object):

    def test_init_defaults(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew")
        assert e.document == "doc"
        assert e.setter == None
        assert e.callback_invoker == None
        e.model = "model"
        e.attr = "attr"
        e.old = "old"
        e.new = "new"
        e.snew = "snew"
        e.hint = None

    def test_init_ignores_hint_with_setter(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew", setter="setter", hint="hint", callback_invoker="invoker")
        assert e.document == "doc"
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"
        e.model = "model"
        e.attr = "attr"
        e.old = "old"
        e.new = "new"
        e.snew = "snew"
        e.hint = None

    def test_init_uses_hint_with_no_setter(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew", hint="hint", callback_invoker="invoker")
        assert e.document == "doc"
        assert e.setter == None
        assert e.callback_invoker == "invoker"
        e.model = "model"
        e.attr = "attr"
        e.old = "old"
        e.new = "new"
        e.snew = "snew"
        e.hint = "hint"

    # TODO (bev) tests for generate

    def test_dispatch(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched', '_document_model_changed']

# ColumnDataChangedEvent ------------------------------------------------------

class ColumnDataChangedEvent(object):

    def test_init(self):
        m = FakeModel()
        e = bde.ColumnDataChangedEvent("doc", m, [1,2], "setter", "invoker")
        assert e.document == "doc"
        assert e.column_source == m
        assert e.cols == [1,2]
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    @patch("bokeh.util.serialization.transform_column_source_data")
    def test_generate(mock_tcds):
        mock_tcds.return_value = "new"
        m = FakeModel()
        e = bde.ColumnDataChangedEvent("doc", m, [1,2], "setter", "invoker")
        refs = dict(foo=10)
        bufs = set()
        r = e.generate(refs, bufs)
        assert r == dict(kind="ColumnDataChanged", column_source="ref", new="new", cols=[1,2])
        assert refs == dict(foo=10)
        assert bufs == set()

    def test_dispatch(self):
        m = FakeModel()
        e = bde.ColumnDataChangedEvent("doc", m, [1,2], "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched', '_column_data_changed']

# ColumnsStreamedEvent --------------------------------------------------------

class ColumnsStreamedEvent(object):

    def test_init(self):
        m = FakeModel()
        e = bde.ColumnsStreamedEvent("doc", m, dict(foo=1), 200, "setter", "invoker")
        assert e.document == "doc"
        assert e.column_source == m
        assert e.data == dict(foo=1)
        assert e.rollover == 200
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_generate(self):
        m = FakeModel()
        e = bde.ColumnsStreamedEvent("doc", m, dict(foo=1), 200, "setter", "invoker")
        refs = dict(foo=10)
        bufs = set()
        r = e.generate(refs, bufs)
        assert r == dict(kind="ColumnsStreamed", column_source="ref", data=dict(foo=1), rollover=200)
        assert refs == dict(foo=10)
        assert bufs == set()

    def test_dispatch(self):
        m = FakeModel()
        e = bde.ColumnsStreamedEvent("doc", m, dict(foo=1), 200, "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched', '_columns_streamed']

# ColumnsPatchedEvent ---------------------------------------------------------

class ColumnsPatchedEvent(object):

    def test_init(self):
        m = FakeModel()
        e = bde.ColumnsPatchedEvent("doc", m, [1, 2], "setter", "invoker")
        assert e.document == "doc"
        assert e.column_source == m
        assert e.patches == [1, 2]
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_generate(self):
        m = FakeModel()
        e = bde.ColumnsPatchedEvent("doc", m, [1, 2], "setter", "invoker")
        refs = dict(foo=10)
        bufs = set()
        r = e.generate(refs, bufs)
        assert r == dict(kind="ColumnsPatched", column_source="ref", patches=[1,2])
        assert refs == dict(foo=10)
        assert bufs == set()

    def test_dispatch(self):
        m = FakeModel()
        e = bde.ColumnsPatchedEvent("doc", m, [1, 2], "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched', '_columns_patched']

# TitleChangedEvent -----------------------------------------------------------

class TitleChangedEvent(object):

    def test_init(self):
        e = bde.TitleChangedEvent("doc", "title", "setter", "invoker")
        assert e.document == "doc"
        assert e.title == "title"
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_generate(self):
        e = bde.TitleChangedEvent("doc", "title", "setter", "invoker")
        refs = dict(foo=10)
        bufs = set()
        r = e.generate(refs, bufs)
        assert r == dict(kind="TitleChanged", title="title")
        assert refs == dict(foo=10)
        assert bufs == set()

    def test_dispatch(self):
        e = bde.TitleChangedEvent("doc", "title", "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched']

# RootAddedEvent --------------------------------------------------------------

class TestRootAddedEvent(object):

    def test_init(self):
        m = FakeModel()
        e = bde.RootAddedEvent("doc", m, "setter", "invoker")
        assert e.document == "doc"
        assert e.model == m
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_generate(self):
        m = FakeModel()
        e = bde.RootAddedEvent("doc", m, "setter", "invoker")
        refs = dict(foo=10)
        bufs = set()
        r = e.generate(refs, bufs)
        assert r == dict(kind="RootAdded", model="ref")
        assert refs == dict(foo=10, ref1=1, ref2=2)
        assert bufs == set()

    def test_dispatch(self):
        m = FakeModel()
        e = bde.RootAddedEvent("doc", m, "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched']

# RootRemovedEvent ------------------------------------------------------------

class TestRootRemovedEvent(object):

    def test_init(self):
        m = FakeModel()
        e = bde.RootRemovedEvent("doc", m, "setter", "invoker")
        assert e.document == "doc"
        assert e.model == m
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    def test_generate(self):
        m = FakeModel()
        e = bde.RootRemovedEvent("doc", m, "setter", "invoker")
        refs = dict(foo=10)
        bufs = set()
        r = e.generate(refs, bufs)
        assert r == dict(kind="RootRemoved", model="ref")
        assert refs == dict(foo=10)
        assert bufs == set()

    def test_dispatch(self):
        m = FakeModel()
        e = bde.RootRemovedEvent("doc", m, "setter", "invoker")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched']

# SessionCallbackAdded --------------------------------------------------------

class TestSessionCallbackAdded(object):

    def test_init(self):
        e = bde.SessionCallbackAdded("doc", "callback")
        assert e.document == "doc"
        assert e.callback == "callback"
        assert e.setter == None
        assert e.callback_invoker == None

    def test_dispatch(self):
        e = bde.SessionCallbackAdded("doc", "callback")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_session_callback_added']

# SessionCallbackRemoved ------------------------------------------------------

class TestSessionCallbackRemoved(object):

    def test_init(self):
        e = bde.SessionCallbackRemoved("doc", "callback")
        assert e.document == "doc"
        assert e.callback == "callback"
        assert e.setter == None
        assert e.callback_invoker == None

    def test_dispatch(self):
        e = bde.SessionCallbackRemoved("doc", "callback")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_session_callback_removed']
