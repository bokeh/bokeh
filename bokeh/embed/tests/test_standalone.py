#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
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

from bokeh.util.api import DEV, GENERAL ; DEV, GENERAL
from bokeh.util.testing import verify_api ; verify_api

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from mock import patch

# External imports
import bs4
from jinja2 import Template
from six import string_types

# Bokeh imports
from bokeh.core.properties import Instance
from bokeh.document import Document
from bokeh.io import curdoc
from bokeh.model import Model
from bokeh.plotting import figure
from bokeh.resources import CDN, JSResources, CSSResources
from bokeh.util.string import encode_utf8

# Module under test
import bokeh.embed.standalone as bes

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

api = {

    GENERAL: (

        ( 'autoload_static', (1,0,0) ),
        ( 'components',      (1,0,0) ),
        ( 'file_html',       (1,0,0) ),

    ), DEV: (

    )

}

Test_api = verify_api(bes, api)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class SomeModelInTestObjects(Model):
    child = Instance(Model)

def stable_id():
    return 'ID'

@pytest.fixture
def test_plot():
    from bokeh.plotting import figure
    test_plot = figure()
    test_plot.circle([1, 2], [2, 3])
    return test_plot

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_autoload_static(object):

    def test_return_type(self, test_plot):
        r = bes.autoload_static(test_plot, CDN, "some/path")
        assert len(r) == 2

    @patch('bokeh.embed.util.make_id', new_callable=lambda: stable_id)
    def test_script_attrs(self, mock_make_id, test_plot):
        js, tag = bes.autoload_static(test_plot, CDN, "some/path")
        html = bs4.BeautifulSoup(tag, "lxml")
        scripts = html.findAll(name='script')
        assert len(scripts) == 1
        attrs = scripts[0].attrs
        assert set(attrs) == set([
            'src',
            'data-bokeh-model-id',
            'id',
            'data-bokeh-doc-id'])
        assert attrs['data-bokeh-doc-id'] == 'ID'
        assert attrs['data-bokeh-model-id'] == str(test_plot._id)
        assert attrs['src'] == 'some/path'


class Test_components(object):

    def test_return_type(self):
        plot1 = figure()
        plot1.circle([], [])
        plot2 = figure()
        plot2.circle([], [])
        # This is a testing artefact, users dont' have to do this in practice
        curdoc().add_root(plot1)
        curdoc().add_root(plot2)

        r = bes.components(plot1)
        assert len(r) == 2

        _, divs = bes.components((plot1, plot2))
        assert isinstance(divs, tuple)

        _, divs = bes.components([plot1, plot2])
        assert isinstance(divs, tuple)

        _, divs = bes.components({"Plot 1": plot1, "Plot 2": plot2})
        assert isinstance(divs, dict)
        assert all(isinstance(x, string_types) for x in divs.keys())

    @patch('bokeh.embed.util.make_id', new_callable=lambda: stable_id)
    def test_plot_dict_returned_when_wrap_plot_info_is_false(self, mock_make_id):
        plot1 = figure()
        plot1.circle([], [])
        plot2 = figure()
        plot2.circle([], [])
        # This is a testing artefact, users dont' have to do this in practice
        curdoc().add_root(plot1)
        curdoc().add_root(plot2)

        expected_plotdict_1 = {"modelid": plot1.ref["id"], "elementid": "ID", "docid": "ID"}
        expected_plotdict_2 = {"modelid": plot2.ref["id"], "elementid": "ID", "docid": "ID"}

        _, plotdict = bes.components(plot1, wrap_plot_info=False)
        assert plotdict == expected_plotdict_1

        _, plotids = bes.components((plot1, plot2), wrap_plot_info=False)
        assert plotids == (expected_plotdict_1, expected_plotdict_2)

        _, plotiddict = bes.components({'p1': plot1, 'p2': plot2}, wrap_plot_info=False)
        assert plotiddict == {'p1': expected_plotdict_1, 'p2': expected_plotdict_2}

    def test_result_attrs(self, test_plot):
        script, div = bes.components(test_plot)
        html = bs4.BeautifulSoup(script, "lxml")
        scripts = html.findAll(name='script')
        assert len(scripts) == 1
        assert scripts[0].attrs == {'type': 'text/javascript'}

    def test_div_attrs(self, test_plot):
        script, div = bes.components(test_plot)
        html = bs4.BeautifulSoup(div, "lxml")

        divs = html.findAll(name='div')
        assert len(divs) == 2

        div = divs[0]
        assert set(div.attrs) == set(['class'])
        assert div.attrs['class'] == ['bk-root']
        assert div.text == '\n\n'

        div = divs[1]
        assert set(div.attrs) == set(['id', 'class'])
        assert div.attrs['class'] == ['bk-plotdiv']
        assert div.text == ''

    def test_script_is_utf8_encoded(self, test_plot):
        script, div = bes.components(test_plot)
        assert isinstance(script, str)

    @patch('bokeh.embed.util.make_id', new_callable=lambda: stable_id)
    def test_output_is_without_script_tag_when_wrap_script_is_false(self, mock_make_id, test_plot):
        script, div = bes.components(test_plot)
        html = bs4.BeautifulSoup(script, "lxml")
        scripts = html.findAll(name='script')
        assert len(scripts) == 1

        # XXX: this needs to account for indentation
        #script_content = scripts[0].getText()

        #rawscript, div = bes.components(test_plot, wrap_script=False)
        #self.maxDiff = None
        #assert rawscript.strip() == script_content.strip()

class Test_file_html(object):

    def test_return_type(self, test_plot):

        class fake_template:
            def __init__(self, tester, user_template_variables=None):
                self.tester = tester
                self.template_variables = {
                    "title",
                    "bokeh_js",
                    "bokeh_css",
                    "plot_script",
                    "plot_div"
                }
                if user_template_variables is not None:
                    self.template_variables.update(user_template_variables)

            def render(self, template_variables):
                assert self.template_variables.issubset(set(template_variables.keys()))
                return "template result"

        r = bes.file_html(test_plot, CDN, "title")
        assert isinstance(r, str)

        r = bes.file_html(test_plot, CDN, "title", fake_template(self))
        assert isinstance(r, str)

        r = bes.file_html(test_plot, CDN, "title",
                            fake_template(self, {"test_var"}),
                            {"test_var": "test"})
        assert isinstance(r, str)

    @patch('bokeh.embed.bundle.warn')
    def test_file_html_handles_js_only_resources(self, mock_warn, test_plot):
        js_resources = JSResources(mode="relative", components=["bokeh"])
        template = Template("<head>{{ bokeh_js }}</head><body></body>")
        output = bes.file_html(test_plot, (js_resources, None), "title", template=template)
        html = encode_utf8("<head>%s</head><body></body>" % js_resources.render_js())
        assert output == html

    @patch('bokeh.embed.bundle.warn')
    def test_file_html_provides_warning_if_no_css(self, mock_warn, test_plot):
        js_resources = JSResources()
        bes.file_html(test_plot, (js_resources, None), "title")
        mock_warn.assert_called_once_with(
            'No Bokeh CSS Resources provided to template. If required you will need to provide them manually.'
        )

    @patch('bokeh.embed.bundle.warn')
    def test_file_html_handles_css_only_resources(self, mock_warn, test_plot):
        css_resources = CSSResources(mode="relative", components=["bokeh"])
        template = Template("<head>{{ bokeh_css }}</head><body></body>")
        output = bes.file_html(test_plot, (None, css_resources), "title", template=template)
        html = encode_utf8("<head>%s</head><body></body>" % css_resources.render_css())
        assert output == html

    @patch('bokeh.embed.bundle.warn')
    def test_file_html_provides_warning_if_no_js(self, mock_warn, test_plot):
        css_resources = CSSResources()
        bes.file_html(test_plot, (None, css_resources), "title")
        mock_warn.assert_called_once_with(
            'No Bokeh JS Resources provided to template. If required you will need to provide them manually.'
        )

    def test_file_html_title_is_escaped(self, test_plot):
        r = bes.file_html(test_plot, CDN, "&<")
        assert "<title>&amp;&lt;</title>" in r

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class Test__ModelInDocument(object):

    def test_single_model(self):
        p = Model()
        assert p.document is None
        with bes._ModelInDocument([p]):
            assert p.document is not None
        assert p.document is None

    def test_list_of_model(self):
        p1 = Model()
        p2 = Model()
        assert p1.document is None
        assert p2.document is None
        with bes._ModelInDocument([p1, p2]):
            assert p1.document is not None
            assert p2.document is not None
        assert p1.document is None
        assert p2.document is None

    def test_uses_precedent(self):
        # it's deliberate that the doc is on p2, so _ModelInDocument
        # has to be smart about looking for a doc anywhere in the list
        # before it starts inventing new documents
        doc = Document()
        p1 = Model()
        p2 = Model()
        doc.add_root(p2)
        assert p1.document is None
        assert p2.document is not None
        with bes._ModelInDocument([p1, p2]):
            assert p1.document is not None
            assert p2.document is not None
            assert p1.document is doc
            assert p2.document is doc
        assert p1.document is None
        assert p2.document is not None

    def test_uses_doc_precedent(self):
        doc = Document()
        p1 = Model()
        p2 = Model()
        assert p1.document is None
        assert p2.document is None
        with bes._ModelInDocument([p1, p2, doc]):
            assert p1.document is not None
            assert p2.document is not None
            assert p1.document is doc
            assert p2.document is doc
        assert p1.document is None
        assert p2.document is None

    def test_with_doc_in_child_raises_error(self):
        doc = Document()
        p1 = Model()
        p2 = SomeModelInTestObjects(child=Model())
        doc.add_root(p2.child)
        assert p1.document is None
        assert p2.document is None
        assert p2.child.document is doc
        with pytest.raises(RuntimeError):
            with bes._ModelInDocument([p1, p2]):
                assert p1.document is not None
                assert p2.document is not None
                assert p1.document is doc
                assert p2.document is doc

    @patch('bokeh.document.document.check_integrity')
    def test_validates_document_by_default(self, check_integrity, test_plot):
        with bes._ModelInDocument([test_plot]):
            pass
        assert check_integrity.called

    @patch('bokeh.document.document.check_integrity')
    def test_doesnt_validate_doc_due_to_env_var(self, check_integrity, monkeypatch, test_plot):
        monkeypatch.setenv("BOKEH_VALIDATE_DOC", "false")
        with bes._ModelInDocument([test_plot]):
            pass
        assert not check_integrity.called

class Test__add_doc_to_models(object):
    pass

class Test__title_from_models(object):
    pass
