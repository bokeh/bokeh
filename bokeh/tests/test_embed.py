from __future__ import absolute_import

import mock
import unittest

import bs4

import bokeh.embed as embed
from bokeh.resources import CDN, INLINE, Resources, JSResources, CSSResources
from bokeh.plotting import figure
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
        expected_plotdict = {"modelid": plot.ref["id"], "elementid": "uuid", "docid": "uuid"}
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
    js_resources = JSResources(mode="relative", components=["bokeh"])
    template = Template("<head>{{ bokeh_js }}</head><body></body>")
    output = embed.file_html(_embed_test_plot, (js_resources, None), "title", template=template)
    html = "<head>%s</head><body></body>" % js_resources.render_js()
    assert output == html


@mock.patch('bokeh.embed.warn')
def test_file_html_provides_warning_if_no_css(mock_warn):
    js_resources = JSResources()
    embed.file_html(_embed_test_plot, (js_resources, None), "title")
    mock_warn.assert_called_once_with(
        'No Bokeh CSS Resources provided to template. If required you will need to provide them manually.'
    )


def test_file_html_handles_css_only_resources():
    css_resources = CSSResources(mode="relative", components=["bokeh"])
    template = Template("<head>{{ bokeh_css }}</head><body></body>")
    output = embed.file_html(_embed_test_plot, (None, css_resources), "title", template=template)
    html = "<head>%s</head><body></body>" % css_resources.render_css()
    assert output == html


@mock.patch('bokeh.embed.warn')
def test_file_html_provides_warning_if_no_js(mock_warn):
    css_resources = CSSResources()
    embed.file_html(_embed_test_plot, (None, css_resources), "title")
    mock_warn.assert_called_once_with(
        'No Bokeh JS Resources provided to template. If required you will need to provide them manually.'
    )


class TestAutoloadStatic(unittest.TestCase):

    def test_return_type(self):
        r = embed.autoload_static(_embed_test_plot, CDN, "some/path")
        self.assertEqual(len(r), 2)

    @mock.patch('bokeh.embed.uuid')
    def test_script_attrs(self, mock_uuid):
        mock_uuid.uuid4 = mock.Mock()
        mock_uuid.uuid4.return_value = 'uuid'
        js, tag = embed.autoload_static(_embed_test_plot, CDN, "some/path")
        html = bs4.BeautifulSoup(tag)
        scripts = html.findAll(name='script')
        self.assertEqual(len(scripts), 1)
        attrs = scripts[0].attrs
        self.assertTrue(set(attrs), set(['src',
            'data-bokeh-model-id',
            'id',
            'data-bokeh-doc-id']))
        self.assertEqual(attrs['data-bokeh-doc-id'], 'uuid')
        self.assertEqual(attrs['data-bokeh-model-id'], str(_embed_test_plot._id))
        self.assertEqual(attrs['src'], 'some/path')


class TestAutoloadServer(unittest.TestCase):

    def test_return_type(self):
        r = embed.autoload_server(_embed_test_plot, session_id='fakesession')
        self.assertTrue(isinstance(r, str))

    def test_script_attrs_session_id_provided(self):
        r = embed.autoload_server(_embed_test_plot, session_id='fakesession')
        self.assertTrue('bokeh-session-id=fakesession' in r)
        html = bs4.BeautifulSoup(r)
        scripts = html.findAll(name='script')
        self.assertEqual(len(scripts), 1)
        attrs = scripts[0].attrs
        self.assertTrue(set(attrs), set([
            'src',
            'data-bokeh-doc-id',
            'data-bokeh-model-id',
            'id'
        ]))
        divid = attrs['id']
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-session-id=fakesession" % \
              ("http://localhost:5006", divid)
        self.assertDictEqual({ 'data-bokeh-doc-id' : '',
                               'data-bokeh-model-id' : str(_embed_test_plot._id),
                               'id' : divid,
                               'src' : src },
                             attrs)

    def test_script_attrs_no_session_id_provided(self):
        r = embed.autoload_server(None)
        self.assertFalse('bokeh-session-id' in r)
        html = bs4.BeautifulSoup(r)
        scripts = html.findAll(name='script')
        self.assertEqual(len(scripts), 1)
        attrs = scripts[0].attrs
        self.assertTrue(set(attrs), set([
            'src',
            'data-bokeh-doc-id',
            'data-bokeh-model-id',
            'id'
        ]))
        divid = attrs['id']
        src = "%s/autoload.js?bokeh-autoload-element=%s" % \
              ("http://localhost:5006", divid)
        self.assertDictEqual({ 'data-bokeh-doc-id' : '',
                               'data-bokeh-model-id' : '',
                               'id' : divid,
                               'src' : src },
                             attrs)

    def test_autoload_server_value_error_on_model_id_without_session_id(self):
        self.assertRaises(ValueError, embed.autoload_server, _embed_test_plot)

if __name__ == "__main__":
    unittest.main()
