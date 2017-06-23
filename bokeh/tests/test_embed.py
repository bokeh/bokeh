from __future__ import absolute_import

import mock
import unittest

import bs4

import bokeh.embed as embed
from bokeh.plotting import figure, curdoc
from bokeh.resources import CDN, JSResources, CSSResources
from bokeh.util.string import encode_utf8
from jinja2 import Template
from six import string_types

_embed_test_plot = None


def setUpModule():
    global _embed_test_plot
    _embed_test_plot = figure()
    _embed_test_plot.circle([1, 2], [2, 3])


def _stable_id():
    return 'ID'


def test_components_return_type():
    plot1 = figure()
    plot2 = figure()
    # This is a testing artefact, users dont' have to do this in practice
    curdoc().add_root(plot1)
    curdoc().add_root(plot2)

    r = embed.components(plot1)
    assert len(r) == 2

    _, divs = embed.components((plot1, plot2))
    assert isinstance(divs, tuple)

    _, divs = embed.components([plot1, plot2])
    assert isinstance(divs, tuple)

    _, divs = embed.components({"Plot 1": plot1, "Plot 2": plot2})
    assert isinstance(divs, dict)
    assert all(isinstance(x, string_types) for x in divs.keys())


@mock.patch('bokeh.embed.make_id', new_callable=lambda: _stable_id)
def test_plot_dict_returned_when_wrap_plot_info_is_false(mock_make_id):
    plot1 = figure()
    plot2 = figure()
    # This is a testing artefact, users dont' have to do this in practice
    curdoc().add_root(plot1)
    curdoc().add_root(plot2)

    expected_plotdict_1 = {"modelid": plot1.ref["id"], "elementid": "ID", "docid": "ID"}
    expected_plotdict_2 = {"modelid": plot2.ref["id"], "elementid": "ID", "docid": "ID"}

    _, plotdict = embed.components(plot1, wrap_plot_info=False)
    assert plotdict == expected_plotdict_1

    _, plotids = embed.components((plot1, plot2), wrap_plot_info=False)
    assert plotids == (expected_plotdict_1, expected_plotdict_2)

    _, plotiddict = embed.components({'p1': plot1, 'p2': plot2}, wrap_plot_info=False)
    assert plotiddict == {'p1': expected_plotdict_1, 'p2': expected_plotdict_2}



class TestComponents(unittest.TestCase):


    def test_result_attrs(self):
        script, div = embed.components(_embed_test_plot)
        html = bs4.BeautifulSoup(script, "lxml")
        scripts = html.findAll(name='script')
        self.assertEqual(len(scripts), 1)
        self.assertTrue(scripts[0].attrs, {'type': 'text/javascript'})

    def test_div_attrs(self):
        script, div = embed.components(_embed_test_plot)
        html = bs4.BeautifulSoup(div, "lxml")

        divs = html.findAll(name='div')
        self.assertEqual(len(divs), 2)

        div = divs[0]
        self.assertEqual(set(div.attrs), set(['class']))
        self.assertEqual(div.attrs['class'], ['bk-root'])
        self.assertEqual(div.text, '\n\n')

        div = divs[1]
        self.assertEqual(set(div.attrs), set(['id', 'class']))
        self.assertEqual(div.attrs['class'], ['bk-plotdiv'])
        self.assertEqual(div.text, '')

    def test_script_is_utf8_encoded(self):
        script, div = embed.components(_embed_test_plot)
        self.assertTrue(isinstance(script, str))

    @mock.patch('bokeh.embed.make_id', new_callable=lambda: _stable_id)
    def test_output_is_without_script_tag_when_wrap_script_is_false(self, mock_make_id):
        script, div = embed.components(_embed_test_plot)
        html = bs4.BeautifulSoup(script, "lxml")
        scripts = html.findAll(name='script')
        self.assertEqual(len(scripts), 1)
        script_content = scripts[0].getText()

        rawscript, div = embed.components(_embed_test_plot, wrap_script=False)
        self.maxDiff = None
        self.assertEqual(rawscript.strip(), script_content.strip())

class TestNotebookDiv(unittest.TestCase):

    def test_return_type(self):
        r = embed.notebook_div(_embed_test_plot)
        self.assertTrue(isinstance(r, str))

    def test_result_attrs(self):
        r = embed.notebook_div(_embed_test_plot)
        html = bs4.BeautifulSoup(r, "lxml")
        scripts = html.findAll(name='script')
        self.assertEqual(len(scripts), 1)
        self.assertTrue(scripts[0].attrs, {'type': 'text/javascript'})

    def test_div_attrs(self):
        r = embed.notebook_div(_embed_test_plot)
        html = bs4.BeautifulSoup(r, "lxml")
        divs = html.findAll(name='div')
        self.assertEqual(len(divs), 2)

        div = divs[0]
        self.assertEqual(set(div.attrs), set(['class']))
        self.assertEqual(div.attrs['class'], ['bk-root'])
        self.assertEqual(div.text, '\n\n')

        div = divs[1]
        self.assertEqual(set(div.attrs), set(['id', 'class']))
        self.assertEqual(div.attrs['class'], ['bk-plotdiv'])
        self.assertEqual(div.text, '')


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
    html = encode_utf8("<head>%s</head><body></body>" % js_resources.render_js())
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
    html = encode_utf8("<head>%s</head><body></body>" % css_resources.render_css())
    assert output == html


@mock.patch('bokeh.embed.warn')
def test_file_html_provides_warning_if_no_js(mock_warn):
    css_resources = CSSResources()
    embed.file_html(_embed_test_plot, (None, css_resources), "title")
    mock_warn.assert_called_once_with(
        'No Bokeh JS Resources provided to template. If required you will need to provide them manually.'
    )


def test_file_html_title_is_escaped():
    r = embed.file_html(_embed_test_plot, CDN, "&<")
    assert "<title>&amp;&lt;</title>" in r


class TestAutoloadStatic(unittest.TestCase):

    def test_return_type(self):
        r = embed.autoload_static(_embed_test_plot, CDN, "some/path")
        self.assertEqual(len(r), 2)

    @mock.patch('bokeh.embed.make_id', new_callable=lambda: _stable_id)
    def test_script_attrs(self, mock_make_id):
        js, tag = embed.autoload_static(_embed_test_plot, CDN, "some/path")
        html = bs4.BeautifulSoup(tag, "lxml")
        scripts = html.findAll(name='script')
        self.assertEqual(len(scripts), 1)
        attrs = scripts[0].attrs
        self.assertTrue(set(attrs), set(['src',
            'data-bokeh-model-id',
            'id',
            'data-bokeh-doc-id']))
        self.assertEqual(attrs['data-bokeh-doc-id'], 'ID')
        self.assertEqual(attrs['data-bokeh-model-id'], str(_embed_test_plot._id))
        self.assertEqual(attrs['src'], 'some/path')


class TestConnectSessionOrDocument(unittest.TestCase):

    def test_invalid_resources_param(self):
        with self.assertRaises(ValueError):
            embed._connect_session_or_document(url="http://localhost:8081/foo/bar/sliders", resources=123)
        with self.assertRaises(ValueError):
            embed._connect_session_or_document(url="http://localhost:8081/foo/bar/sliders", resources="whatever")

    def test_resources_default_is_implicit(self):
        r = embed._connect_session_or_document(url="http://localhost:8081/foo/bar/sliders", resources="default")
        self.assertFalse('resources=' in r)

    def test_resources_none(self):
        r = embed._connect_session_or_document(url="http://localhost:8081/foo/bar/sliders", resources=None)
        self.assertTrue('resources=none' in r)


class TestServerDocument(unittest.TestCase):

    def test_ensure_no_session_do_model(self):
        r = embed.server_document(url="http://localhost:8081/foo/bar/sliders")
        self.assertTrue('bokeh-app-path=/foo/bar/sliders' in r)
        self.assertTrue('bokeh-absolute-url=http://localhost:8081/foo/bar/sliders' in r)
        html = bs4.BeautifulSoup(r, "lxml")
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
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-app-path=/foo/bar/sliders&bokeh-absolute-url=%s" % \
              ("http://localhost:8081/foo/bar/sliders", divid, "http://localhost:8081/foo/bar/sliders")
        self.assertDictEqual({ 'data-bokeh-doc-id' : '',
                               'data-bokeh-model-id' : '',
                               'id' : divid,
                               'src' : src },
                             attrs)

class TestServerSession(unittest.TestCase):

    def test_model_and_session_both_required(self):
        with self.assertRaises(TypeError):
            embed.server_session()
        with self.assertRaises(TypeError):
            embed.server_session(_embed_test_plot)
        with self.assertRaises(TypeError):
            embed.server_session(session_id='fakesession')

    def test_ensure_session_and_model(self):
        r = embed.server_session(_embed_test_plot, session_id='fakesession')
        self.assertTrue('bokeh-session-id=fakesession' in r)
        html = bs4.BeautifulSoup(r, "lxml")
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
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-absolute-url=%s&bokeh-session-id=fakesession" % \
              ("http://localhost:5006", divid, "http://localhost:5006")
        self.assertDictEqual({ 'data-bokeh-doc-id' : '',
                               'data-bokeh-model-id' : str(_embed_test_plot._id),
                               'id' : divid,
                               'src' : src },
                             attrs)

class TestAutoloadServer(unittest.TestCase):

    def test_return_type(self):
        r = embed.autoload_server(_embed_test_plot, session_id='fakesession')
        self.assertTrue(isinstance(r, str))

    def test_script_attrs_session_id_provided(self):
        r = embed.autoload_server(_embed_test_plot, session_id='fakesession')
        self.assertTrue('bokeh-session-id=fakesession' in r)
        html = bs4.BeautifulSoup(r, "lxml")
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
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-absolute-url=%s&bokeh-session-id=fakesession" % \
              ("http://localhost:5006", divid, "http://localhost:5006")
        self.assertDictEqual({ 'data-bokeh-doc-id' : '',
                               'data-bokeh-model-id' : str(_embed_test_plot._id),
                               'id' : divid,
                               'src' : src },
                             attrs)

    def test_script_attrs_no_session_id_provided(self):
        r = embed.autoload_server(None)
        self.assertFalse('bokeh-session-id' in r)
        html = bs4.BeautifulSoup(r, "lxml")
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
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-absolute-url=%s" % \
              ("http://localhost:5006", divid, "http://localhost:5006")
        self.assertDictEqual({ 'data-bokeh-doc-id' : '',
                               'data-bokeh-model-id' : '',
                               'id' : divid,
                               'src' : src },
                             attrs)

    def test_script_attrs_url_provided(self):
        r = embed.autoload_server(url="http://localhost:8081/foo/bar/sliders", relative_urls=True)
        self.assertTrue('bokeh-app-path=/foo/bar/sliders' in r)
        html = bs4.BeautifulSoup(r, "lxml")
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
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-app-path=/foo/bar/sliders" % \
              ("http://localhost:8081/foo/bar/sliders", divid)
        self.assertDictEqual({ 'data-bokeh-doc-id' : '',
                               'data-bokeh-model-id' : '',
                               'id' : divid,
                               'src' : src },
                             attrs)

    def test_script_attrs_url_provided_absolute_resources(self):
        r = embed.autoload_server(url="http://localhost:8081/foo/bar/sliders")
        self.assertTrue('bokeh-app-path=/foo/bar/sliders' in r)
        self.assertTrue('bokeh-absolute-url=http://localhost:8081/foo/bar/sliders' in r)
        html = bs4.BeautifulSoup(r, "lxml")
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
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-app-path=/foo/bar/sliders&bokeh-absolute-url=%s" % \
              ("http://localhost:8081/foo/bar/sliders", divid, "http://localhost:8081/foo/bar/sliders")
        self.assertDictEqual({ 'data-bokeh-doc-id' : '',
                               'data-bokeh-model-id' : '',
                               'id' : divid,
                               'src' : src },
                             attrs)

    def test_script_attrs_url_and_app_path_provided(self):
        for path in ("/foo/bar/sliders", "/foo/bar/sliders/", "foo/bar/sliders", "foo/bar/sliders"):
            r = embed.autoload_server(url="http://localhost:8081", app_path=path, relative_urls=True)
            self.assertTrue('bokeh-app-path=/foo/bar/sliders' in r)
            html = bs4.BeautifulSoup(r, "lxml")
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
            src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-app-path=/foo/bar/sliders" % \
                  ("http://localhost:8081/foo/bar/sliders", divid)
            self.assertDictEqual({ 'data-bokeh-doc-id' : '',
                                   'data-bokeh-model-id' : '',
                                   'id' : divid,
                                   'src' : src },
                                 attrs)

    def test_script_attrs_arguments_provided(self):
        r = embed.server_document(arguments=dict(foo=10))
        self.assertTrue('foo=10' in r)
        html = bs4.BeautifulSoup(r, "lxml")
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
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-absolute-url=%s&foo=10" % \
              ("http://localhost:5006", divid, "http://localhost:5006")
        self.assertDictEqual({ 'data-bokeh-doc-id' : '',
                               'data-bokeh-model-id' : '',
                               'id' : divid,
                               'src' : src },
                             attrs)


@mock.patch('bokeh.document.check_integrity')
def test_modelindocument_validates_document_by_default(check_integrity):
    p = figure()
    with embed._ModelInDocument([p]):
        pass
    assert check_integrity.called

@mock.patch('bokeh.document.check_integrity')
def test_modelindocument_doesnt_validate_doc_due_to_env_var(check_integrity, monkeypatch):
    monkeypatch.setenv("BOKEH_VALIDATE_DOC", "false")
    p = figure()
    with embed._ModelInDocument([p]):
        pass
    assert not check_integrity.called

@mock.patch('bokeh.document.check_integrity')
def test_modelinemptydocument_validates_document_by_default(check_integrity):
    p = figure()
    with embed._ModelInEmptyDocument(p):
        pass
    assert check_integrity.called

@mock.patch('bokeh.document.check_integrity')
def test_modelinemptydocument_doesnt_validate_document_due_to_env_var(check_integrity, monkeypatch):
    monkeypatch.setenv("BOKEH_VALIDATE_DOC", "false")
    p = figure()
    with embed._ModelInEmptyDocument(p):
        pass
    assert not check_integrity.called
