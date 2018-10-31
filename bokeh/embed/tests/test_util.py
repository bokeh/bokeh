#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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
import logging

# External imports
from mock import patch

# Bokeh imports
from bokeh import __version__
from bokeh.core.properties import Instance, Int, String, List
from bokeh.document.document import Document
from bokeh.io import curdoc
from bokeh.events import Tap
from bokeh.model import Model
from bokeh.themes import Theme
from bokeh.util.logconfig import basicConfig

# Module under test
import bokeh.embed.util as beu

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

@pytest.fixture
def test_plot():
    from bokeh.plotting import figure
    test_plot = figure()
    test_plot.circle([1, 2], [2, 3])
    return test_plot

class SomeModelInTestObjects(Model):
    child = Instance(Model)

# Taken from test_callback_manager.py
class _GoodPropertyCallback(object):

    def __init__(self):
        self.last_name = None
        self.last_old = None
        self.last_new = None

    def __call__(self, name, old, new):
        self.method(name, old, new)

    def method(self, name, old, new):
        self.last_name = name
        self.last_old = old
        self.last_new = new

    def partially_good(self, name, old, new, newer):
        pass

    def just_fine(self, name, old, new, extra='default'):
        pass

class _GoodEventCallback(object):

    def __init__(self):
        self.last_name = None
        self.last_old = None
        self.last_new = None

    def __call__(self, event):
        self.method(event)

    def method(self, event):
        self.event = event

    def partially_good(self, arg, event):
        pass

# Taken from test_model
class EmbedTestUtilModel(Model):
    a = Int(12)
    b = String("hello")
    c = List(Int, [1, 2, 3])

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Test_FromCurdoc(object):

    def test_type(self):
        assert isinstance(beu.FromCurdoc, type)

_ODFERR = "OutputDocumentFor expects a sequence of Models"

class Test_OutputDocumentFor_general(object):

    def test_error_on_empty_list(self):
        with pytest.raises(ValueError) as e:
            with beu.OutputDocumentFor([]):
                pass
        assert str(e).endswith(_ODFERR)

    def test_error_on_mixed_list(self):
        p = Model()
        d = Document()
        orig_theme = d.theme
        with pytest.raises(ValueError) as e:
            with beu.OutputDocumentFor([p, d]):
                pass
        assert str(e).endswith(_ODFERR)
        assert d.theme is orig_theme

    @pytest.mark.parametrize('v', [10, -0,3, "foo", True])
    def test_error_on_wrong_types(self, v):
        with pytest.raises(ValueError) as e:
            with beu.OutputDocumentFor(v):
                pass
        assert str(e).endswith(_ODFERR)

    def test_with_doc_in_child_raises_error(self):
        doc = Document()
        p1 = Model()
        p2 = SomeModelInTestObjects(child=Model())
        doc.add_root(p2.child)
        assert p1.document is None
        assert p2.document is None
        assert p2.child.document is doc
        with pytest.raises(RuntimeError) as e:
            with beu.OutputDocumentFor([p1, p2]):
                pass
            assert "already in a doc" in str(e)

    @patch('bokeh.document.document.check_integrity')
    def test_validates_document_by_default(self, check_integrity, test_plot):
        with beu.OutputDocumentFor([test_plot]):
            pass
        assert check_integrity.called

    @patch('bokeh.document.document.check_integrity')
    def test_doesnt_validate_doc_due_to_env_var(self, check_integrity, monkeypatch, test_plot):
        monkeypatch.setenv("BOKEH_VALIDATE_DOC", "false")
        with beu.OutputDocumentFor([test_plot]):
            pass
        assert not check_integrity.called

class Test_OutputDocumentFor_default_apply_theme(object):

    def test_single_model_with_document(self):
        # should use existing doc in with-block
        p = Model()
        d = Document()
        orig_theme = d.theme
        d.add_root(p)
        with beu.OutputDocumentFor([p]):
            assert p.document is d
            assert d.theme is orig_theme
        assert p.document is d
        assert d.theme is orig_theme

    def test_single_model_with_no_document(self):
        p = Model()
        assert p.document is None
        with beu.OutputDocumentFor([p]):
            assert p.document is not None
        assert p.document is not None

    def test_list_of_model_with_no_documents(self):
        # should create new (permanent) doc for inputs
        p1 = Model()
        p2 = Model()
        assert p1.document is None
        assert p2.document is None
        with beu.OutputDocumentFor([p1, p2]):
            assert p1.document is not None
            assert p2.document is not None
            assert p1.document is p2.document
            new_doc = p1.document
            new_theme = p1.document.theme
        assert p1.document is new_doc
        assert p1.document is p2.document
        assert p1.document.theme is new_theme

    def test_list_of_model_same_as_roots(self):
        # should use existing doc in with-block
        p1 = Model()
        p2 = Model()
        d = Document()
        orig_theme = d.theme
        d.add_root(p1)
        d.add_root(p2)
        with beu.OutputDocumentFor([p1, p2]):
            assert p1.document is d
            assert p2.document is d
            assert d.theme is orig_theme
        assert p1.document is d
        assert p2.document is d
        assert d.theme is orig_theme

    def test_list_of_model_same_as_roots_with_always_new(self):
        # should use new temp doc for everything inside with-block
        p1 = Model()
        p2 = Model()
        d = Document()
        orig_theme = d.theme
        d.add_root(p1)
        d.add_root(p2)
        with beu.OutputDocumentFor([p1, p2], always_new=True):
            assert p1.document is not d
            assert p2.document is not d
            assert p1.document is p2.document
            assert p2.document.theme is orig_theme
        assert p1.document is d
        assert p2.document is d
        assert d.theme is orig_theme

    def test_list_of_model_subset_roots(self):
        # should use new temp doc for subset inside with-block
        p1 = Model()
        p2 = Model()
        d = Document()
        orig_theme = d.theme
        d.add_root(p1)
        d.add_root(p2)
        with beu.OutputDocumentFor([p1]):
            assert p1.document is not d
            assert p2.document is d
            assert p1.document.theme is orig_theme
            assert p2.document.theme is orig_theme
        assert p1.document is d
        assert p2.document is d
        assert d.theme is orig_theme

    def test_list_of_models_different_docs(self):
        # should use new temp doc for eveything inside with-block
        d = Document()
        orig_theme = d.theme
        p1 = Model()
        p2 = Model()
        d.add_root(p2)
        assert p1.document is None
        assert p2.document is not None
        with beu.OutputDocumentFor([p1, p2]):
            assert p1.document is not None
            assert p2.document is not None
            assert p1.document is not d
            assert p2.document is not d
            assert p1.document == p2.document
            assert p1.document.theme is orig_theme
        assert p1.document is None
        assert p2.document is not None
        assert p2.document.theme is orig_theme

class Test_OutputDocumentFor_custom_apply_theme(object):

    def test_single_model_with_document(self):
        # should use existing doc in with-block
        p = Model()
        d = Document()
        orig_theme = d.theme
        d.add_root(p)
        with beu.OutputDocumentFor([p], apply_theme=Theme(json={})):
            assert p.document is d
            assert d.theme is not orig_theme
        assert p.document is d
        assert d.theme is orig_theme

    def test_single_model_with_no_document(self):
        p = Model()
        assert p.document is None
        with beu.OutputDocumentFor([p], apply_theme=Theme(json={})):
            assert p.document is not None
            new_theme = p.document.theme
        assert p.document is not None
        assert p.document.theme is not new_theme

    def test_list_of_model_with_no_documents(self):
        # should create new (permanent) doc for inputs
        p1 = Model()
        p2 = Model()
        assert p1.document is None
        assert p2.document is None
        with beu.OutputDocumentFor([p1, p2], apply_theme=Theme(json={})):
            assert p1.document is not None
            assert p2.document is not None
            assert p1.document is p2.document
            new_doc = p1.document
            new_theme = p1.document.theme
        assert p1.document is new_doc
        assert p2.document is new_doc
        assert p1.document is p2.document
        # should restore to default theme after with-block
        assert p1.document.theme is not new_theme

    def test_list_of_model_same_as_roots(self):
        # should use existing doc in with-block
        p1 = Model()
        p2 = Model()
        d = Document()
        orig_theme = d.theme
        d.add_root(p1)
        d.add_root(p2)
        with beu.OutputDocumentFor([p1, p2], apply_theme=Theme(json={})):
            assert p1.document is d
            assert p2.document is d
            assert d.theme is not orig_theme
        assert p1.document is d
        assert p2.document is d
        assert d.theme is orig_theme

    def test_list_of_model_same_as_roots_with_always_new(self):
        # should use new temp doc for everything inside with-block
        p1 = Model()
        p2 = Model()
        d = Document()
        orig_theme = d.theme
        d.add_root(p1)
        d.add_root(p2)
        with beu.OutputDocumentFor([p1, p2], always_new=True, apply_theme=Theme(json={})):
            assert p1.document is not d
            assert p2.document is not d
            assert p1.document is p2.document
            assert p2.document.theme is not orig_theme
        assert p1.document is d
        assert p2.document is d
        assert d.theme is orig_theme

    def test_list_of_model_subset_roots(self):
        # should use new temp doc for subset inside with-block
        p1 = Model()
        p2 = Model()
        d = Document()
        orig_theme = d.theme
        d.add_root(p1)
        d.add_root(p2)
        with beu.OutputDocumentFor([p1], apply_theme=Theme(json={})):
            assert p1.document is not d
            assert p2.document is d
            assert p1.document.theme is not orig_theme
            assert p2.document.theme is orig_theme
        assert p1.document is d
        assert p2.document is d
        assert d.theme is orig_theme

    def test_list_of_models_different_docs(self):
        # should use new temp doc for eveything inside with-block
        d = Document()
        orig_theme = d.theme
        p1 = Model()
        p2 = Model()
        d.add_root(p2)
        assert p1.document is None
        assert p2.document is not None
        with beu.OutputDocumentFor([p1, p2], apply_theme=Theme(json={})):
            assert p1.document is not None
            assert p2.document is not None
            assert p1.document is not d
            assert p2.document is not d
            assert p1.document == p2.document
            assert p1.document.theme is not orig_theme
        assert p1.document is None
        assert p2.document is not None
        assert p2.document.theme is orig_theme

class Test_OutputDocumentFor_FromCurdoc_apply_theme(object):

    def setup_method(self):
        self.orig_theme = curdoc().theme
        curdoc().theme = Theme(json={})

    def teardown_method(self):
        curdoc().theme = self.orig_theme

    def test_single_model_with_document(self):
        # should use existing doc in with-block
        p = Model()
        d = Document()
        orig_theme = d.theme
        d.add_root(p)
        with beu.OutputDocumentFor([p], apply_theme=beu.FromCurdoc):
            assert p.document is d
            assert d.theme is curdoc().theme
        assert p.document is d
        assert d.theme is orig_theme

    def test_single_model_with_no_document(self):
        p = Model()
        assert p.document is None
        with beu.OutputDocumentFor([p], apply_theme=beu.FromCurdoc):
            assert p.document is not None
            assert p.document.theme is curdoc().theme
            new_doc = p.document
        assert p.document is new_doc
        assert p.document.theme is not curdoc().theme

    def test_list_of_model_with_no_documents(self):
        # should create new (permanent) doc for inputs
        p1 = Model()
        p2 = Model()
        assert p1.document is None
        assert p2.document is None
        with beu.OutputDocumentFor([p1, p2], apply_theme=beu.FromCurdoc):
            assert p1.document is not None
            assert p2.document is not None
            assert p1.document is p2.document
            new_doc = p1.document
            assert p1.document.theme is curdoc().theme
        assert p1.document is new_doc
        assert p2.document is new_doc
        assert p1.document is p2.document
        # should restore to default theme after with-block
        assert p1.document.theme is not curdoc().theme

    def test_list_of_model_same_as_roots(self):
        # should use existing doc in with-block
        p1 = Model()
        p2 = Model()
        d = Document()
        orig_theme = d.theme
        d.add_root(p1)
        d.add_root(p2)
        with beu.OutputDocumentFor([p1, p2], apply_theme=beu.FromCurdoc):
            assert p1.document is d
            assert p2.document is d
            assert d.theme is curdoc().theme
        assert p1.document is d
        assert p2.document is d
        assert d.theme is orig_theme

    def test_list_of_model_same_as_roots_with_always_new(self):
        # should use new temp doc for everything inside with-block
        p1 = Model()
        p2 = Model()
        d = Document()
        orig_theme = d.theme
        d.add_root(p1)
        d.add_root(p2)
        with beu.OutputDocumentFor([p1, p2], always_new=True, apply_theme=beu.FromCurdoc):
            assert p1.document is not d
            assert p2.document is not d
            assert p1.document is p2.document
            assert p2.document.theme is curdoc().theme
        assert p1.document is d
        assert p2.document is d
        assert d.theme is orig_theme

    def test_list_of_model_subset_roots(self):
        # should use new temp doc for subset inside with-block
        p1 = Model()
        p2 = Model()
        d = Document()
        orig_theme = d.theme
        d.add_root(p1)
        d.add_root(p2)
        with beu.OutputDocumentFor([p1], apply_theme=beu.FromCurdoc):
            assert p1.document is not d
            assert p2.document is d
            assert p1.document.theme is curdoc().theme
            assert p2.document.theme is orig_theme
        assert p1.document is d
        assert p2.document is d
        assert d.theme is orig_theme

    def test_list_of_models_different_docs(self):
        # should use new temp doc for eveything inside with-block
        d = Document()
        orig_theme = d.theme
        p1 = Model()
        p2 = Model()
        d.add_root(p2)
        assert p1.document is None
        assert p2.document is not None
        with beu.OutputDocumentFor([p1, p2], apply_theme=beu.FromCurdoc):
            assert p1.document is not None
            assert p2.document is not None
            assert p1.document is not d
            assert p2.document is not d
            assert p1.document == p2.document
            assert p1.document.theme is curdoc().theme
        assert p1.document is None
        assert p2.document is not None
        assert p2.document.theme is orig_theme

class Test_standalone_docs_json_and_render_items(object):

    def test_passing_model(self):
        p1 = Model()
        d = Document()
        d.add_root(p1)
        docs_json, render_items = beu.standalone_docs_json_and_render_items([p1])
        doc = list(docs_json.values())[0]
        assert doc['title'] == "Bokeh Application"
        assert doc['version'] == __version__
        assert len(doc['roots']['root_ids']) == 1
        assert len(doc['roots']['references']) == 1
        assert doc['roots']['references'] == [{'attributes': {}, 'id': str(p1._id), 'type': 'Model'}]
        assert len(render_items) == 1

    def test_passing_doc(self):
        p1 = Model()
        d = Document()
        d.add_root(p1)
        docs_json, render_items = beu.standalone_docs_json_and_render_items([d])
        doc = list(docs_json.values())[0]
        assert doc['title'] == "Bokeh Application"
        assert doc['version'] == __version__
        assert len(doc['roots']['root_ids']) == 1
        assert len(doc['roots']['references']) == 1
        assert doc['roots']['references'] == [{'attributes': {}, 'id': str(p1._id), 'type': 'Model'}]
        assert len(render_items) == 1

    def test_exception_for_missing_doc(self):
        p1 = Model()
        with pytest.raises(ValueError) as e:
            beu.standalone_docs_json_and_render_items([p1])
        assert str(e.value) == "A Bokeh Model must be part of a Document to render as standalone content"

    def test_log_warning_if_python_property_callback(self, caplog):
        d = Document()
        m1 = EmbedTestUtilModel()
        c1 = _GoodPropertyCallback()
        d.add_root(m1)

        m1.on_change('name', c1)
        assert len(m1._callbacks) != 0

        with caplog.at_level(logging.WARN):
            beu.standalone_docs_json_and_render_items(m1)
            assert len(caplog.records) == 1
            assert caplog.text != ''

    def test_log_warning_if_python_event_callback(self, caplog):
        d = Document()
        m1 = EmbedTestUtilModel()
        c1 = _GoodEventCallback()
        d.add_root(m1)

        m1.on_event(Tap, c1)
        assert len(m1._event_callbacks) != 0

        with caplog.at_level(logging.WARN):
            beu.standalone_docs_json_and_render_items(m1)
            assert len(caplog.records) == 1
            assert caplog.text != ''

    def test_suppress_warnings(self, caplog):
        d = Document()
        m1 = EmbedTestUtilModel()
        c1 = _GoodPropertyCallback()
        c2 = _GoodEventCallback()
        d.add_root(m1)

        m1.on_change('name', c1)
        assert len(m1._callbacks) != 0

        m1.on_event(Tap, c2)
        assert len(m1._event_callbacks) != 0

        with caplog.at_level(logging.WARN):
            beu.standalone_docs_json_and_render_items(m1, suppress_callback_warning=True)
            assert len(caplog.records) == 0
            assert caplog.text == ''

class Test_standalone_docs_json(object):

    @patch('bokeh.embed.util.standalone_docs_json_and_render_items')
    def test_delgation(self, mock_sdjari):
        p1 = Model()
        p2 = Model()
        d = Document()
        d.add_root(p1)
        d.add_root(p2)
        # ignore error unpacking None mock result, just checking to see that
        # standalone_docs_json_and_render_items is called as expected
        try:
            beu.standalone_docs_json([p1, p2])
        except ValueError:
            pass
        mock_sdjari.assert_called_once_with([p1, p2])

    def test_output(self):
        p1 = Model()
        p2 = Model()
        d = Document()
        d.add_root(p1)
        d.add_root(p2)
        out = beu.standalone_docs_json([p1, p2])
        expected = beu.standalone_docs_json_and_render_items([p1, p2])[0]
        assert list(out.values()) ==list(expected.values())

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class Test__create_temp_doc(object):

    def test_no_docs(self):
        p1 = Model()
        p2 = Model()
        beu._create_temp_doc([p1, p2])
        assert isinstance(p1.document, Document)
        assert isinstance(p2.document, Document)

    def test_top_level_same_doc(self):
        d = Document()
        p1 = Model()
        p2 = Model()
        d.add_root(p1)
        d.add_root(p2)
        beu._create_temp_doc([p1, p2])
        assert isinstance(p1.document, Document)
        assert p1.document is not d
        assert isinstance(p2.document, Document)
        assert p2.document is not d

        assert p2.document == p1.document

    def test_top_level_different_doc(self):
        d1 = Document()
        d2 = Document()
        p1 = Model()
        p2 = Model()
        d1.add_root(p1)
        d2.add_root(p2)
        beu._create_temp_doc([p1, p2])
        assert isinstance(p1.document, Document)
        assert p1.document is not d1
        assert isinstance(p2.document, Document)
        assert p2.document is not d2

        assert p2.document == p1.document

    def test_child_docs(self):
        d = Document()
        p1 = Model()
        p2 = SomeModelInTestObjects(child=Model())
        d.add_root(p2.child)
        beu._create_temp_doc([p1, p2])

        assert isinstance(p1.document, Document)
        assert p1.document is not d
        assert isinstance(p2.document, Document)
        assert p2.document is not d
        assert isinstance(p2.child.document, Document)
        assert p2.child.document is not d

        assert p2.document == p1.document
        assert p2.document == p2.child.document

class Test__dispose_temp_doc(object):

    def test_no_docs(self):
        p1 = Model()
        p2 = Model()
        beu._dispose_temp_doc([p1, p2])
        assert p1.document is None
        assert p2.document is None

    def test_with_docs(self):
        d1 = Document()
        d2 = Document()
        p1 = Model()
        d1.add_root(p1)
        p2 = SomeModelInTestObjects(child=Model())
        d2.add_root(p2.child)
        beu._create_temp_doc([p1, p2])
        beu._dispose_temp_doc([p1, p2])
        assert p1.document is d1
        assert p2.document is None
        assert p2.child.document is d2

    def test_with_temp_docs(self):
        p1 = Model()
        p2 = Model()
        beu._create_temp_doc([p1, p2])
        beu._dispose_temp_doc([p1, p2])
        assert p1.document is None
        assert p2.document is None

class Test__set_temp_theme(object):
    def test_apply_None(self):
        d = Document()
        orig = d.theme
        beu._set_temp_theme(d, None)
        assert d._old_theme is orig
        assert d.theme is orig

    def test_apply_theme(self):
        t = Theme(json={})
        d = Document()
        orig = d.theme
        beu._set_temp_theme(d, t)
        assert d._old_theme is orig
        assert d.theme is t

    def test_apply_from_curdoc(self):
        t = Theme(json={})
        curdoc().theme = t
        d = Document()
        orig = d.theme
        beu._set_temp_theme(d, beu.FromCurdoc)
        assert d._old_theme is orig
        assert d.theme is t

class Test__unset_temp_theme(object):
    def test_basic(self):
        t = Theme(json={})
        d = Document()
        d._old_theme = t
        beu._unset_temp_theme(d)
        assert d.theme is t
        assert not hasattr(d, "_old_theme")

    def test_no_old_theme(self):
        d = Document()
        orig = d.theme
        beu._unset_temp_theme(d)
        assert d.theme is orig
        assert not hasattr(d, "_old_theme")

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

# needed for caplog tests to function
basicConfig()
