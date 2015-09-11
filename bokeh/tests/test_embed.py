from __future__ import absolute_import

import mock
import unittest

import bs4

import bokeh.embed as embed
from bokeh.resources import CDN, INLINE, Resources, JSResources, CSSResources
from bokeh.templates import JS_RESOURCES, CSS_RESOURCES
from bokeh.plotting import figure
from bokeh.session import Session
from jinja2 import Template
from six import string_types

_embed_test_plot = None

def setUpModule():
    global _embed_test_plot
    _embed_test_plot = figure()
    _embed_test_plot.circle([1,2], [2,3])

class TestComponents(unittest.TestCase):

    def test_return_type(self):
        r = embed.components(_embed_test_plot)
        self.assertEqual(len(r), 2)

        script, divs = embed.components((_embed_test_plot, _embed_test_plot))
        self.assertTrue(isinstance(divs, tuple))

        script, divs = embed.components([_embed_test_plot, _embed_test_plot])
        self.assertTrue(isinstance(divs, tuple))

        script, divs = embed.components({"Plot 1": _embed_test_plot, "Plot 2": _embed_test_plot})
        self.assertTrue(isinstance(divs, dict) and all(isinstance(x, string_types) for x in divs.keys()))

    def test_result_attrs(self):
        script, div = embed.components(_embed_test_plot)
        html = bs4.BeautifulSoup(script)
        scripts = html.findAll(name='script')
        self.assertEqual(len(scripts), 1)
        self.assertTrue(scripts[0].attrs, {'type': 'text/javascript'})

    def test_div_attrs(self):
        script, div = embed.components(_embed_test_plot)
        html = bs4.BeautifulSoup(div)

        divs = html.findAll(name='div')
        self.assertEqual(len(divs), 1)

        div = divs[0]
        self.assertTrue(set(div.attrs), set(['class', 'id']))
        self.assertEqual(div.attrs['class'], ['plotdiv'])
        self.assertEqual(div.text, "")

    def test_script_is_utf8_encoded(self):
        script, div = embed.components(_embed_test_plot)
        self.assertTrue(isinstance(script, str))

    @mock.patch('bokeh.embed.uuid')
    def test_output_is_without_script_tag_when_wrap_script_is_false(self, mock_uuid):
        mock_uuid.uuid4 = mock.Mock()
        mock_uuid.uuid4.return_value = 'uuid'

        script, div = embed.components(_embed_test_plot)
        html = bs4.BeautifulSoup(script)
        scripts = html.findAll(name='script')
        self.assertEqual(len(scripts), 1)
        script_content = scripts[0].getText()

        rawscript, div = embed.components(_embed_test_plot, wrap_script=False)
        self.maxDiff = None
        self.assertEqual(rawscript.strip(), script_content.strip())

    @mock.patch('bokeh.embed.uuid')
    def test_plot_dict_returned_when_wrap_plot_info_is_false(self, mock_uuid):
        mock_uuid.uuid4 = mock.Mock()
        mock_uuid.uuid4.return_value = 'uuid'

        plot = _embed_test_plot
        expected_plotdict = {"modelid": plot.ref["id"], "elementid": "uuid", "modeltype": "Plot"}
        script, plotdict = embed.components(_embed_test_plot, wrap_plot_info=False)
        self.assertEqual(plotdict, expected_plotdict)

        script, plotids = embed.components((_embed_test_plot, _embed_test_plot), wrap_plot_info=False)
        self.assertEqual(plotids, (expected_plotdict, expected_plotdict))

        script, plotiddict = embed.components({'p1': _embed_test_plot, 'p2': _embed_test_plot}, wrap_plot_info=False)
        self.assertEqual(plotiddict, {'p1': expected_plotdict, 'p2': expected_plotdict})


class TestNotebookDiv(unittest.TestCase):

    def test_return_type(self):
        r = embed.notebook_div(_embed_test_plot)
        self.assertTrue(isinstance(r, str))

    def test_result_attrs(self):
        r = embed.notebook_div(_embed_test_plot)
        html = bs4.BeautifulSoup(r)
        scripts = html.findAll(name='script')
        self.assertEqual(len(scripts), 1)
        self.assertTrue(scripts[0].attrs, {'type': 'text/javascript'})

    def test_div_attrs(self):
        r = embed.notebook_div(_embed_test_plot)
        html = bs4.BeautifulSoup(r)
        divs = html.findAll(name='div')
        self.assertEqual(len(divs), 1)

        div = divs[0]
        self.assertTrue(set(div.attrs), set(['class', 'id']))
        self.assertEqual(div.attrs['class'], ['plotdiv'])
        self.assertEqual(div.text, "")

class TestFileHTML(unittest.TestCase):

    def test_return_type(self):

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
                self.tester.assertTrue(
                    self.template_variables.issubset(
                        set(template_variables.keys())
                    )
                )
                return "template result"

        r = embed.file_html(_embed_test_plot, CDN, "title")
        self.assertTrue(isinstance(r, str))

        r = embed.file_html(_embed_test_plot, CDN, "title", fake_template(self))
        self.assertTrue(isinstance(r, str))

        r = embed.file_html(_embed_test_plot, CDN, "title",
                            fake_template(self, {"test_var"}),
                            {"test_var": "test"})
        self.assertTrue(isinstance(r, str))


def test_file_html_handles_js_only_resources():
    js_resources = JSResources()
    template = Template("<head>{{ bokeh_js }}</head><body></body>")
    output = embed.file_html(_embed_test_plot, None, "title", template=template, js_resources=js_resources)
    rendered_js = JS_RESOURCES.render(js_raw=js_resources.js_raw)
    assert output == "<head>%s</head><body></body>" % rendered_js


@mock.patch('bokeh.embed.warn')
def test_file_html_provides_warning_if_no_css(mock_warn):
    js_resources = JSResources()
    embed.file_html(_embed_test_plot, None, "title", js_resources=js_resources)
    mock_warn.assert_called_once_with(
        'No Bokeh CSS Resources provided to template. If required you will need to provide them manually.'
    )


@mock.patch('bokeh.embed.warn')
def test_file_html_provides_warning_if_both_resources_and_js_provided(mock_warn):
    js_resources = JSResources()
    embed.file_html(_embed_test_plot, CDN, "title", js_resources=js_resources)
    mock_warn.assert_called_once_with(
        'Both resources and js_resources provided. resources will override js_resources.'
    )


@mock.patch('bokeh.embed.warn')
def test_file_html_provides_warning_if_both_resources_and_css_provided(mock_warn):
    css_resources = CSSResources()
    embed.file_html(_embed_test_plot, CDN, "title", css_resources=css_resources)
    mock_warn.assert_called_once_with(
        'Both resources and css_resources provided. resources will override css_resources.'
    )


def test_file_html_handles_css_only_resources():
    css_resources = CSSResources()
    template = Template("<head>{{ bokeh_css }}</head><body></body>")
    output = embed.file_html(_embed_test_plot, None, "title", template=template, css_resources=css_resources)
    rendered_css = CSS_RESOURCES.render(css_raw=css_resources.css_raw)
    assert output == "<head>%s</head><body></body>" % rendered_css


@mock.patch('bokeh.embed.warn')
def test_file_html_provides_warning_if_no_js(mock_warn):
    css_resources = CSSResources()
    embed.file_html(_embed_test_plot, None, "title", css_resources=css_resources)
    mock_warn.assert_called_once_with(
        'No Bokeh JS Resources provided to template. If required you will need to provide them manually.'
    )


class TestAutoloadStatic(unittest.TestCase):

    def test_invalid_resources(self):
        self.assertRaises(ValueError, embed.autoload_static, _embed_test_plot, INLINE, "some/path")

        dev_resources = (Resources("absolute-dev"), Resources("server-dev"),Resources("relative-dev"))
        for x in dev_resources:
            self.assertRaises(ValueError, embed.autoload_static, _embed_test_plot, x, "some/path")

    def test_return_type(self):
        r = embed.autoload_static(_embed_test_plot, CDN, "some/path")
        self.assertEqual(len(r), 2)

    def test_script_attrs(self):
        js, tag = embed.autoload_static(_embed_test_plot, CDN, "some/path")
        html = bs4.BeautifulSoup(tag)
        scripts = html.findAll(name='script')
        self.assertEqual(len(scripts), 1)
        attrs = scripts[0].attrs
        self.assertTrue(set(attrs), set(['src',
            'data-bokeh-modeltype',
            'data-bokeh-modelid',
            'async',
            'id',
            'data-bokeh-data']))
        self.assertEqual(attrs['async'], 'true')
        self.assertEqual(attrs['data-bokeh-data'], 'static')
        self.assertEqual(attrs['data-bokeh-modeltype'], 'Plot')
        self.assertEqual(attrs['data-bokeh-modelid'], str(_embed_test_plot._id))
        self.assertEqual(attrs['src'], 'some/path')


class TestAutoloadServer(unittest.TestCase):

    def setUp(self):
        self.sess = Session(load_from_config=False)
        self.sess.docid = 'docid10'
        self.sess.apikey = 'apikey123'
        self.sess.root_url = "http://foo"

    def test_return_type(self):
        r = embed.autoload_server(_embed_test_plot, self.sess)
        self.assertTrue(isinstance(r, str))

    def test_script_attrs(self):
        r = embed.autoload_server(_embed_test_plot, self.sess)
        html = bs4.BeautifulSoup(r)
        scripts = html.findAll(name='script')
        self.assertEqual(len(scripts), 1)
        attrs = scripts[0].attrs
        self.assertTrue(set(attrs), set([
            'src',
            'data-bokeh-docid',
            'data-bokeh-docapikey',
            'data-bokeh-modeltype',
            'data-bokeh-modelid',
            'data-bokeh-root-url',
            'async',
            'id',
            'data-bokeh-data',
            'data-bokeh-conn-string'
        ]))
        self.assertEqual(attrs['async'], 'true')
        self.assertEqual(attrs['data-bokeh-data'], 'server')
        self.assertEqual(attrs['data-bokeh-docapikey'], 'apikey123')
        self.assertEqual(attrs['data-bokeh-docid'], 'docid10')
        self.assertEqual(attrs['data-bokeh-modelid'], str(_embed_test_plot._id))
        self.assertEqual(attrs['data-bokeh-root-url'], "http://foo/")
        divid = attrs['id']
        self.assertEqual(attrs['src'], "%s/bokeh/autoload.js/%s" % ("http://foo", divid))


if __name__ == "__main__":
    unittest.main()
