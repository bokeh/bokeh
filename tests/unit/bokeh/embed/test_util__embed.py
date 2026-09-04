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
from unittest.mock import patch

# Bokeh imports
from bokeh.core.properties import Instance, Int
from bokeh.document.document import Document
from bokeh.io import curdoc
from bokeh.model import Model
from bokeh.themes import DARK_MINIMAL, Theme, built_in_themes
from bokeh.util.logconfig import basicConfig

# Module under test
import bokeh.embed.util as beu # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

@pytest.fixture
def test_plot() -> None:
    from bokeh.plotting import figure
    test_plot = figure()
    test_plot.scatter([1, 2], [2, 3])
    return test_plot

class SomeModel(Model):
    some = Int

class OtherModel(Model):
    child = Instance(Model)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


class Test_FromCurdoc:
    def test_type(self) -> None:
        assert isinstance(beu.FromCurdoc, type)

_ODFERR = "OutputDocumentFor expects a non-empty sequence of Models"


class Test_OutputDocumentFor_general:
    def test_error_on_empty_list(self) -> None:
        with pytest.raises(ValueError) as e:
            with beu.OutputDocumentFor([]):
                pass
        assert str(e.value).endswith(_ODFERR)

    def test_error_on_mixed_list(self) -> None:
        p = SomeModel()
        d = Document()
        orig_theme = d.theme
        with pytest.raises(ValueError) as e:
            with beu.OutputDocumentFor([p, d]):
                pass
        assert str(e.value).endswith(_ODFERR)
        assert d.theme is orig_theme

    @pytest.mark.parametrize('v', [10, -0,3, "foo", True])
    def test_error_on_wrong_types(self, v) -> None:
        with pytest.raises(ValueError) as e:
            with beu.OutputDocumentFor(v):
                pass
        assert str(e.value).endswith(_ODFERR)

    def test_with_doc_in_child_raises_error(self) -> None:
        doc = Document()
        p1 = SomeModel()
        p2 = OtherModel(child=SomeModel())
        doc.add_root(p2.child)
        assert p1.document is None
        assert p2.document is None
        assert p2.child.document is doc
        with pytest.raises(RuntimeError) as e:
            with beu.OutputDocumentFor([p1, p2]):
                pass
            assert "already in a doc" in str(e.value)

    @patch('bokeh.document.document.check_integrity')
    def test_validates_document_by_default(self, check_integrity, test_plot) -> None:
        with beu.OutputDocumentFor([test_plot]):
            pass
        assert check_integrity.called

    @patch('bokeh.document.document.check_integrity')
    def test_doesnt_validate_doc_due_to_env_var(self, check_integrity, monkeypatch: pytest.MonkeyPatch, test_plot) -> None:
        monkeypatch.setenv("BOKEH_VALIDATE_DOC", "false")
        with beu.OutputDocumentFor([test_plot]):
            pass
        assert not check_integrity.called

    def test_cleans_up_after_exception(self) -> None:
        p = SomeModel()
        theme = Theme(json={})

        with pytest.raises(RuntimeError):
            with beu.OutputDocumentFor([p], always_new=True, apply_theme=theme) as doc:
                assert p.document is doc
                assert doc.theme is theme
                raise RuntimeError("boom")

        assert p.document is None


class Test_OutputDocumentFor_default_apply_theme:
    def test_single_model_with_document(self) -> None:
        # should use existing doc in with-block
        p = SomeModel()
        d = Document()
        orig_theme = d.theme
        d.add_root(p)
        with beu.OutputDocumentFor([p]):
            assert p.document is d
            assert d.theme is orig_theme
        assert p.document is d
        assert d.theme is orig_theme

    def test_single_model_with_no_document(self) -> None:
        p = SomeModel()
        assert p.document is None
        with beu.OutputDocumentFor([p]):
            assert p.document is not None
        assert p.document is not None

    def test_list_of_model_with_no_documents(self) -> None:
        # should create new (permanent) doc for inputs
        p1 = SomeModel()
        p2 = SomeModel()
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

    def test_list_of_model_same_as_roots(self) -> None:
        # should use existing doc in with-block
        p1 = SomeModel()
        p2 = SomeModel()
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

    def test_list_of_model_same_as_roots_with_always_new(self) -> None:
        # should use new temp doc for everything inside with-block
        p1 = SomeModel()
        p2 = SomeModel()
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

    def test_list_of_model_subset_roots(self) -> None:
        # should use new temp doc for subset inside with-block
        p1 = SomeModel()
        p2 = SomeModel()
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

    def test_list_of_models_different_docs(self) -> None:
        # should use new temp doc for everything inside with-block
        d = Document()
        orig_theme = d.theme
        p1 = SomeModel()
        p2 = SomeModel()
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


class Test_OutputDocumentFor_custom_apply_theme:
    def test_single_model_with_document(self) -> None:
        # should use existing doc in with-block
        p = SomeModel()
        d = Document()
        orig_theme = d.theme
        d.add_root(p)
        with beu.OutputDocumentFor([p], apply_theme=Theme(json={})):
            assert p.document is d
            assert d.theme is not orig_theme
        assert p.document is d
        assert d.theme is orig_theme

    def test_single_model_with_no_document(self) -> None:
        p = SomeModel()
        assert p.document is None
        with beu.OutputDocumentFor([p], apply_theme=Theme(json={})):
            assert p.document is not None
            new_theme = p.document.theme
        assert p.document is not None
        assert p.document.theme is not new_theme

    def test_list_of_model_with_no_documents(self) -> None:
        # should create new (permanent) doc for inputs
        p1 = SomeModel()
        p2 = SomeModel()
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

    def test_list_of_model_same_as_roots(self) -> None:
        # should use existing doc in with-block
        p1 = SomeModel()
        p2 = SomeModel()
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

    def test_list_of_model_same_as_roots_with_always_new(self) -> None:
        # should use new temp doc for everything inside with-block
        p1 = SomeModel()
        p2 = SomeModel()
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

    def test_list_of_model_subset_roots(self) -> None:
        # should use new temp doc for subset inside with-block
        p1 = SomeModel()
        p2 = SomeModel()
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

    def test_list_of_models_different_docs(self) -> None:
        # should use new temp doc for everything inside with-block
        d = Document()
        orig_theme = d.theme
        p1 = SomeModel()
        p2 = SomeModel()
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


class Test_OutputDocumentFor_FromCurdoc_apply_theme:
    def setup_method(self):
        self.orig_theme = curdoc().theme
        curdoc().theme = Theme(json={})

    def teardown_method(self):
        curdoc().theme = self.orig_theme

    def test_single_model_with_document(self) -> None:
        # should use existing doc in with-block
        p = SomeModel()
        d = Document()
        orig_theme = d.theme
        d.add_root(p)
        with beu.OutputDocumentFor([p], apply_theme=beu.FromCurdoc):
            assert p.document is d
            assert d.theme is curdoc().theme
        assert p.document is d
        assert d.theme is orig_theme

    def test_single_model_with_no_document(self) -> None:
        p = SomeModel()
        assert p.document is None
        with beu.OutputDocumentFor([p], apply_theme=beu.FromCurdoc):
            assert p.document is not None
            assert p.document.theme is curdoc().theme
            new_doc = p.document
        assert p.document is new_doc
        assert p.document.theme is not curdoc().theme

    def test_list_of_model_with_no_documents(self) -> None:
        # should create new (permanent) doc for inputs
        p1 = SomeModel()
        p2 = SomeModel()
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

    def test_list_of_model_same_as_roots(self) -> None:
        # should use existing doc in with-block
        p1 = SomeModel()
        p2 = SomeModel()
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

    def test_list_of_model_same_as_roots_with_always_new(self) -> None:
        # should use new temp doc for everything inside with-block
        p1 = SomeModel()
        p2 = SomeModel()
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

    def test_list_of_model_subset_roots(self) -> None:
        # should use new temp doc for subset inside with-block
        p1 = SomeModel()
        p2 = SomeModel()
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

    def test_list_of_models_different_docs(self) -> None:
        # should use new temp doc for everything inside with-block
        d = Document()
        orig_theme = d.theme
        p1 = SomeModel()
        p2 = SomeModel()
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


#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------


class Test__create_temp_doc:
    def test_no_docs(self) -> None:
        p1 = SomeModel()
        p2 = SomeModel()
        beu._create_temp_doc([p1, p2])
        assert isinstance(p1.document, Document)
        assert isinstance(p2.document, Document)

    def test_top_level_same_doc(self) -> None:
        d = Document()
        p1 = SomeModel()
        p2 = SomeModel()
        d.add_root(p1)
        d.add_root(p2)
        beu._create_temp_doc([p1, p2])
        assert isinstance(p1.document, Document)
        assert p1.document is not d
        assert isinstance(p2.document, Document)
        assert p2.document is not d

        assert p2.document == p1.document

    def test_top_level_different_doc(self) -> None:
        d1 = Document()
        d2 = Document()
        p1 = SomeModel()
        p2 = SomeModel()
        d1.add_root(p1)
        d2.add_root(p2)
        beu._create_temp_doc([p1, p2])
        assert isinstance(p1.document, Document)
        assert p1.document is not d1
        assert isinstance(p2.document, Document)
        assert p2.document is not d2

        assert p2.document == p1.document

    def test_child_docs(self) -> None:
        d = Document()
        p1 = SomeModel()
        p2 = OtherModel(child=SomeModel())
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


class Test__dispose_temp_doc:
    def test_no_docs(self) -> None:
        p1 = SomeModel()
        p2 = SomeModel()
        beu._dispose_temp_doc([p1, p2])
        assert p1.document is None
        assert p2.document is None

    def test_with_docs(self) -> None:
        d1 = Document()
        d2 = Document()
        p1 = SomeModel()
        d1.add_root(p1)
        p2 = OtherModel(child=SomeModel())
        d2.add_root(p2.child)
        beu._create_temp_doc([p1, p2])
        beu._dispose_temp_doc([p1, p2])
        assert p1.document is d1
        assert p2.document is None
        assert p2.child.document is d2

    def test_with_temp_docs(self) -> None:
        p1 = SomeModel()
        p2 = SomeModel()
        beu._create_temp_doc([p1, p2])
        beu._dispose_temp_doc([p1, p2])
        assert p1.document is None
        assert p2.document is None

class Test__set_temp_theme:
    def test_apply_None(self) -> None:
        d = Document()
        orig = d.theme
        beu._set_temp_theme(d, None)
        assert beu._themes[d] is orig
        assert d.theme is orig

    def test_apply_theme(self) -> None:
        t = Theme(json={})
        d = Document()
        orig = d.theme
        beu._set_temp_theme(d, t)
        assert beu._themes[d] is orig
        assert d.theme is t

    def test_apply_builtin_theme_name(self) -> None:
        d = Document()
        orig = d.theme
        beu._set_temp_theme(d, DARK_MINIMAL)
        assert beu._themes[d] is orig
        assert d.theme is built_in_themes[DARK_MINIMAL]

    def test_apply_from_curdoc(self) -> None:
        t = Theme(json={})
        curdoc().theme = t
        d = Document()
        orig = d.theme
        beu._set_temp_theme(d, beu.FromCurdoc)
        assert beu._themes[d] is orig
        assert d.theme is t

class Test__unset_temp_theme:
    def test_basic(self) -> None:
        t = Theme(json={})
        d = Document()
        beu._themes[d] = t
        beu._unset_temp_theme(d)
        assert d.theme is t
        assert d not in beu._themes

    def test_no_old_theme(self) -> None:
        d = Document()
        orig = d.theme
        beu._unset_temp_theme(d)
        assert d.theme is orig
        assert d not in beu._themes

class Test__tex_helpers:
    def test_is_tex_string(self) -> None:
        assert beu.is_tex_string("$$test$$") is True
        assert beu.is_tex_string("$$test$$  ") is False
        assert beu.is_tex_string("  $$test$$") is False
        assert beu.is_tex_string("  $$test$$  ") is False
        assert beu.is_tex_string("\\[test\\]") is True
        assert beu.is_tex_string("\\(test\\)") is True
        assert beu.is_tex_string("HTML <b>text</b> $$\\sin(x) and \\[x\\cdot\\pi\\]!") is False
        assert beu.is_tex_string("\\[test\\]") is True
        assert beu.is_tex_string("\\(test\\)") is True
        assert beu.is_tex_string("test$$") is False
        assert beu.is_tex_string("$$test") is False
        assert beu.is_tex_string("HTML <b>text</b> $$sin(x)$$ and [xcdotpi]!") is False
        assert beu.is_tex_string("$$test\\]") is False
        assert beu.is_tex_string("$$test $$ end $$") is True
        assert beu.is_tex_string("$$ \\[test end\\]") is False
        assert beu.is_tex_string("text \\[text $$latex$$") is False
        assert beu.is_tex_string("$$ tex [ tex ] tex $$") is True
        assert beu.is_tex_string("$$tex$$text$$tex$$") is True
        assert beu.is_tex_string("part0$$part1\\[part2\\(part3$$") is False
        assert beu.is_tex_string("part0$$part1\\[part2\\(part3\\]") is False
        assert beu.is_tex_string("part0$$part1\\[part2\\(part3\\)") is False
        assert beu.is_tex_string("""$$
          cos(x)
        $$""") is True
        assert beu.is_tex_string("""$$
          cos(x)$$
        """) is False

    def test_contains_tex_string(self) -> None:
        assert beu.contains_tex_string("$$test$$") is True
        assert beu.contains_tex_string("\\[test\\]") is True
        assert beu.contains_tex_string("\\(test\\)") is True
        assert beu.contains_tex_string("HTML <b>text</b> $$\\sin(x) and \\[x\\cdot\\pi\\]!") is True
        assert beu.contains_tex_string("\\[test\\]") is True
        assert beu.contains_tex_string("\\(test\\)") is True
        assert beu.contains_tex_string("test$$") is False
        assert beu.contains_tex_string("$$test") is False
        assert beu.contains_tex_string("HTML <b>text</b> $$sin(x)$$ and [xcdotpi]!") is True
        assert beu.contains_tex_string("$$test\\]") is False
        assert beu.contains_tex_string("$$test $$ end $$") is True
        assert beu.contains_tex_string("$$ \\[test end\\]") is True
        assert beu.contains_tex_string("text \\[text $$latex$$") is True
        assert beu.contains_tex_string("$$ tex [ tex ] tex $$") is True
        assert beu.contains_tex_string("$$tex$$text$$tex$$") is True
        assert beu.contains_tex_string("part0$$part1\\[part2\\(part3$$") is True
        assert beu.contains_tex_string("part0$$part1\\[part2\\(part3\\]") is True
        assert beu.contains_tex_string("part0$$part1\\[part2\\(part3\\)") is True
        assert beu.contains_tex_string("""$$
          cos(x)
        $$""") is True
        assert beu.contains_tex_string("""$$
          cos(x)$$
        """) is True
#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

# needed for caplog tests to function
basicConfig()
