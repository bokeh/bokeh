#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest


#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from mock import patch

# Module under test
import bokeh.document.events as bde

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

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

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# DocumentChangedEvent --------------------------------------------------------

class TestDocumentChangedEvent(object):

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

    def test_combine_ignores_all(self):
        e = bde.DocumentChangedEvent("doc", "setter", "invoker")
        e2 = bde.DocumentChangedEvent("doc", "setter", "invoker")
        assert e.combine(e2) == False

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

    def test_combine_ignores_all(self):
        e = bde.DocumentPatchedEvent("doc", "setter", "invoker")
        e2 = bde.DocumentPatchedEvent("doc", "setter", "invoker")
        assert e.combine(e2) == False

# ModelChangedEvent -----------------------------------------------------------

class TestModelChangedEvent(object):

    def test_init_defaults(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew")
        assert e.document == "doc"
        assert e.setter == None
        assert e.callback_invoker == None
        assert e.model == "model"
        assert e.attr == "attr"
        assert e.old == "old"
        assert e.new == "new"
        assert e.serializable_new == "snew"
        assert e.hint == None
        assert e.callback_invoker == None

    def test_init_ignores_hint_with_setter(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew", setter="setter", hint="hint", callback_invoker="invoker")
        assert e.document == "doc"
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"
        assert e.model == "model"
        assert e.attr == "attr"
        assert e.old == "old"
        assert e.new == "new"
        assert e.serializable_new == "snew"
        assert e.hint == "hint"
        assert e.callback_invoker == "invoker"

    def test_init_uses_hint_with_no_setter(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew", hint="hint", callback_invoker="invoker")
        assert e.document == "doc"
        assert e.setter == None
        assert e.callback_invoker == "invoker"
        assert e.model == "model"
        assert e.attr == "attr"
        assert e.old == "old"
        assert e.new == "new"
        assert e.serializable_new == "snew"
        assert e.hint == "hint"
        assert e.callback_invoker == "invoker"

    # TODO (bev) tests for generate

    def test_dispatch(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew")
        e.dispatch(FakeEmptyDispatcher())
        d = FakeFullDispatcher()
        e.dispatch(d)
        assert d.called == ['_document_changed', '_document_patched', '_document_model_changed']

    def test_combine_ignores_except_title_changd_event(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew")
        e2 = bde.DocumentPatchedEvent("doc", "setter", "invoker")
        assert e.combine(e2) == False

    def test_combine_ignores_different_setter(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew", None, "setter")
        e2  = bde.ModelChangedEvent("doc", "model", "attr", "old2", "new2", "snew2", None, "setter2")
        assert e.combine(e2) == False

    def test_combine_ignores_different_doc(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew")
        e2 = bde.ModelChangedEvent("doc2", "model", "attr", "old2", "new2", "snew2")
        assert e.combine(e2) == False

    def test_combine_ignores_different_model(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew")
        e2 = bde.ModelChangedEvent("doc", "model2", "attr", "old2", "new2", "snew2")
        assert e.combine(e2) == False

    def test_combine_ignores_different_attr(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew")
        e2 = bde.ModelChangedEvent("doc", "model", "attr2", "old2", "new2", "snew2")
        assert e.combine(e2) == False

    def test_combine_with_matching_model_changed_event(self):
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew", callback_invoker="invoker")
        e2 = bde.ModelChangedEvent("doc", "model", "attr", "old2", "new2", "snew2", callback_invoker="invoker2")
        assert e.combine(e2) == True
        assert e.old == "old"  # keeps original old value
        assert e.new == "new2"
        assert e.serializable_new == "snew2"
        assert e.callback_invoker == "invoker2"

    @patch("bokeh.document.events.ColumnsStreamedEvent.combine")
    def test_combine_with_hint_defers(self, mock_combine):
        mock_combine.return_value = False
        m = FakeModel()
        h = bde.ColumnsStreamedEvent("doc", m, dict(foo=1), 200, "setter", "invoker")
        h2 = bde.ColumnsStreamedEvent("doc", m, dict(foo=2), 300, "setter", "invoker")
        e = bde.ModelChangedEvent("doc", "model", "attr", "old", "new", "snew", hint=h, callback_invoker="invoker")
        e2 = bde.ModelChangedEvent("doc", "model", "attr", "old2", "new2", "snew2", hint=h2, callback_invoker="invoker2")
        assert e.combine(e2) == False
        assert mock_combine.call_count == 1
        assert mock_combine.call_args[0] == (h2,)
        assert mock_combine.call_args[1] == {}

# ColumnDataChangedEvent ------------------------------------------------------

class TestColumnDataChangedEvent(object):

    def test_init(self):
        m = FakeModel()
        e = bde.ColumnDataChangedEvent("doc", m, [1,2], "setter", "invoker")
        assert e.document == "doc"
        assert e.column_source == m
        assert e.cols == [1,2]
        assert e.setter == "setter"
        assert e.callback_invoker == "invoker"

    @patch("bokeh.util.serialization.transform_column_source_data")
    def test_generate(self, mock_tcds):
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

    def test_combine_ignores_all(self):
        m = FakeModel()
        e = bde.ColumnDataChangedEvent("doc", m, [1,2], "setter", "invoker")
        e2 = bde.ColumnDataChangedEvent("doc", m, [3,4], "setter", "invoker")
        assert e.combine(e2) == False
        assert e.cols == [1,2]

# ColumnsStreamedEvent --------------------------------------------------------

class TestColumnsStreamedEvent(object):

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

    def test_combine_ignores_all(self):
        m = FakeModel()
        e = bde.ColumnsStreamedEvent("doc", m, dict(foo=1), 200, "setter", "invoker")
        e2 = bde.ColumnsStreamedEvent("doc", m, dict(foo=2), 300, "setter", "invoker")
        assert e.combine(e2) == False
        assert e.column_source is m
        assert e.data == dict(foo=1)
        assert e.rollover == 200

    def test_pandas_data(self, pd):
        m = FakeModel()
        df = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
        e = bde.ColumnsStreamedEvent("doc", m, df, 200, "setter", "invoker")
        assert isinstance(e.data, dict)
        assert e.data == {c: df[c] for c in df.columns}

# ColumnsPatchedEvent ---------------------------------------------------------

class TestColumnsPatchedEvent(object):

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

    def test_combine_ignores_all(self):
        m = FakeModel()
        e = bde.ColumnsPatchedEvent("doc", m, [1,2], "setter", "invoker")
        e2 = bde.ColumnsPatchedEvent("doc", m, [3,4], "setter", "invoker")
        assert e.combine(e2) == False
        assert e.patches == [1,2]

# TitleChangedEvent -----------------------------------------------------------

class TestTitleChangedEvent(object):

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

    def test_combine_ignores_except_title_changd_event(self):
        e = bde.TitleChangedEvent("doc", "title", "setter", "invoker")
        e2 = bde.DocumentPatchedEvent("doc", "setter", "invoker")
        assert e.combine(e2) == False
        assert e.title == "title"
        assert e.callback_invoker == "invoker"

    def test_combine_ignores_different_setter(self):
        e = bde.TitleChangedEvent("doc", "title", "setter", "invoker")
        e2 = bde.TitleChangedEvent("doc", "title2", "setter2", "invoker2")
        assert e.combine(e2) == False
        assert e.title == "title"
        assert e.callback_invoker == "invoker"

    def test_combine_ignores_different_doc(self):
        e = bde.TitleChangedEvent("doc", "title", "setter", "invoker")
        e2 = bde.TitleChangedEvent("doc2", "title2", "setter2", "invoker2")
        assert e.combine(e2) == False
        assert e.title == "title"
        assert e.callback_invoker == "invoker"

    def test_combine_with_title_changed_event(self):
        e = bde.TitleChangedEvent("doc", "title", "setter", "invoker")
        e2 = bde.TitleChangedEvent("doc", "title2", "setter", "invoker2")
        assert e.combine(e2) == True
        assert e.title == "title2"
        assert e.callback_invoker == "invoker2"

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

    def test_combine_ignores_all(self):
        e = bde.SessionCallbackAdded("doc", "setter")
        e2 = bde.SessionCallbackAdded("doc", "setter")
        assert e.combine(e2) == False

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

    def test_combine_ignores_all(self):
        e = bde.SessionCallbackAdded("doc", "setter")
        e2 = bde.SessionCallbackAdded("doc", "setter")
        assert e.combine(e2) == False

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
