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
from mock import patch

# External imports
import bs4
from jinja2 import Template
from six import string_types

# Bokeh imports
from bokeh.document import Document
from bokeh.embed.util import standalone_docs_json
from bokeh.io import curdoc
from bokeh.plotting import figure
from bokeh.resources import CDN, JSResources, CSSResources
from bokeh.util.string import encode_utf8

# Module under test
import bokeh.embed.standalone as bes
from bokeh.embed.util import RenderRoot

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

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

    def test_script_attrs(self, test_plot):
        js, tag = bes.autoload_static(test_plot, CDN, "some/path")
        html = bs4.BeautifulSoup(tag, "lxml")
        scripts = html.findAll(name='script')
        assert len(scripts) == 1
        attrs = scripts[0].attrs
        assert set(attrs) == set(['src', 'id'])
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

    @patch('bokeh.embed.util.make_globally_unique_id', new_callable=lambda: stable_id)
    def test_plot_dict_returned_when_wrap_plot_info_is_false(self, mock_make_id):
        doc = Document()
        plot1 = figure()
        plot1.circle([], [])
        doc.add_root(plot1)

        plot2 = figure()
        plot2.circle([], [])
        doc.add_root(plot2)

        expected_plotdict_1 = RenderRoot(elementid="ID", id="ID")
        expected_plotdict_2 = RenderRoot(elementid="ID", id="ID")

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
        assert len(divs) == 1

        div = divs[0]
        assert set(div.attrs) == set(['class', 'id'])
        assert div.attrs['class'] == ['bk-root']
        assert div.text == ''

    def test_script_is_utf8_encoded(self, test_plot):
        script, div = bes.components(test_plot)
        assert isinstance(script, str)

    def test_output_is_without_script_tag_when_wrap_script_is_false(self, test_plot):
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
                    "doc",
                    "docs",
                    "base",
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

    def test_entire_doc_is_not_used(self):
        from bokeh.document import Document
        from bokeh.models import Button

        fig = figure()
        fig.x([0], [0])

        button = Button(label="Button")

        d = Document()
        d.add_root(fig)
        d.add_root(button)
        out = bes.file_html([fig], CDN)

        # this is a very coarse test but it will do
        assert "bokeh-widgets" not in out

class Test_json_item(object):

    def test_with_target_id(self, test_plot):
        out = bes.json_item(test_plot, target="foo")
        assert out['target_id'] == "foo"

    def test_without_target_id(self, test_plot):
        out = bes.json_item(test_plot)
        assert out['target_id'] == None

    def test_doc_json(self, test_plot):
        out = bes.json_item(test_plot, target="foo")
        expected = list(standalone_docs_json([test_plot]).values())[0]
        assert out['doc'] == expected

    def test_doc_title(self, test_plot):
        out = bes.json_item(test_plot, target="foo")
        assert out['doc']['title'] == ""

    def test_root_id(self, test_plot):
        out = bes.json_item(test_plot, target="foo")
        assert out['doc']['roots']['root_ids'][0] == out['root_id']

    @patch('bokeh.embed.standalone.OutputDocumentFor')
    def test_apply_theme(self, mock_OFD, test_plot):
        # the subsequent call inside ODF will fail since the model was never
        # added to a document. Ignoring that since we just want to make sure
        # ODF is called with the expected theme arg.
        try:
            bes.json_item(test_plot, theme="foo")
        except ValueError:
            pass
        mock_OFD.assert_called_once_with([test_plot], apply_theme="foo")


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class Test__title_from_models(object):
    pass

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
