from __future__ import absolute_import

import unittest

import bs4

import bokeh.embed as embed
from bokeh.resources import CDN, INLINE, Resources
from bokeh.plotting import figure
from bokeh.session import Session

_embed_test_plot = None

def setUpModule():
    global _embed_test_plot
    _embed_test_plot = figure()
    _embed_test_plot.circle([1,2], [2,3])

class TestComponents(unittest.TestCase):

    def test_return_type(self):
        r = embed.components(_embed_test_plot, CDN)
        self.assertEqual(len(r), 2)

    def test_result_attrs(self):
        script, div = embed.components(_embed_test_plot, CDN)
        html = bs4.BeautifulSoup(script)
        scripts = html.findAll(name='script')
        self.assertEqual(len(scripts), 1)
        self.assertTrue(scripts[0].attrs, {'type': 'text/javascript'})

    def test_div_attrs(self):
        script, div = embed.components(_embed_test_plot, CDN)
        html = bs4.BeautifulSoup(div)

        divs = html.findAll(name='div')
        self.assertEqual(len(divs), 1)

        div = divs[0]
        self.assertTrue(set(div.attrs), set(['class', 'id']))
        self.assertEqual(div.attrs['class'], ['plotdiv'])
        self.assertEqual(div.text, "")

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
            def render(self, title, plot_resources, plot_script, plot_div):
                return "template result"

        r = embed.file_html(_embed_test_plot, CDN, "title")
        self.assertTrue(isinstance(r, str))

        r = embed.file_html(_embed_test_plot, CDN, "title", fake_template())
        self.assertTrue(isinstance(r, str))

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
