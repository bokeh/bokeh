from __future__ import absolute_import

import unittest

from os.path import join

import bokeh
import bokeh.resources as resources
from bokeh.resources import _get_cdn_urls

WRAPPER = """Bokeh.$(function() {
    foo
});"""

WRAPPER_DEV = '''require(["jquery", "main"], function($, Bokeh) {
Bokeh.set_log_level("info");
    Bokeh.$(function() {
        foo
    });
});'''

LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']

DEFAULT_JOG_JS_RAW = 'Bokeh.set_log_level("info");'

class TestResources(unittest.TestCase):

    def test_basic(self):
        r = resources.Resources()
        self.assertEqual(r.mode, "inline")

    def test_log_level(self):
        r = resources.Resources()
        for level in LOG_LEVELS:
            r.log_level = level
            self.assertEqual(r.log_level, level)
            if not r.dev:
                self.assertEqual(r.js_raw[-1], 'Bokeh.set_log_level("%s");' % level)
        self.assertRaises(ValueError, setattr, r, "log_level", "foo")

    def test_module_attrs(self):
        self.assertEqual(resources.CDN.mode, "cdn")
        self.assertEqual(resources.INLINE.mode, "inline")

    def test_inline(self):
        r = resources.Resources(mode="inline")
        self.assertEqual(r.mode, "inline")
        self.assertEqual(r.dev, False)

        self.assertEqual(len(r.js_raw), 2)
        self.assertEqual(r.js_raw[-1], DEFAULT_JOG_JS_RAW)
        self.assertEqual(len(r.css_raw), 1)
        self.assertEqual(r.messages, [])

    def test_get_cdn_urls(self):
        dev_version = "0.0.1dev"
        result = _get_cdn_urls(dev_version)
        url = result['js_files'][0]
        self.assertIn('bokeh/dev', url)

    def test_cdn(self):
        resources.__version__ = "1.0"
        r = resources.Resources(mode="cdn", version="1.0")
        self.assertEqual(r.mode, "cdn")
        self.assertEqual(r.dev, False)

        self.assertEqual(r.js_raw, [DEFAULT_JOG_JS_RAW])
        self.assertEqual(r.css_raw, [])
        self.assertEqual(r.messages, [])

        resources.__version__ = "1.0-1-abc"
        r = resources.Resources(mode="cdn", version="1.0")
        self.assertEqual(r.messages, [
            {'text': "Requesting CDN BokehJS version '1.0' from Bokeh development version '1.0-1-abc'. This configuration is unsupported and may not work!",
            'type': 'warn'}
        ])

    def test_server(self):
        r = resources.Resources(mode="server")
        self.assertEqual(r.mode, "server")
        self.assertEqual(r.dev, False)

        self.assertEqual(r.js_raw, [DEFAULT_JOG_JS_RAW])
        self.assertEqual(r.css_raw, [])
        self.assertEqual(r.messages, [])

        r = resources.Resources(mode="server", root_url="http://foo/")

        self.assertEqual(r.js_raw, [DEFAULT_JOG_JS_RAW])
        self.assertEqual(r.css_raw, [])
        self.assertEqual(r.messages, [])

    def test_server_dev(self):
        r = resources.Resources(mode="server-dev")
        self.assertEqual(r.mode, "server")
        self.assertEqual(r.dev, True)

        self.assertEqual(len(r.js_raw), 1)
        self.assertTrue(r.js_raw[0].startswith('require.config({ baseUrl:'))
        self.assertTrue(r.js_raw[0].endswith(join('static', 'js') + '" });'))
        self.assertEqual(r.css_raw, [])
        self.assertEqual(r.messages, [])

        r = resources.Resources(mode="server-dev", root_url="http://foo/")

        self.assertEqual(len(r.js_raw), 1)
        self.assertTrue(r.js_raw[0].startswith('require.config({ baseUrl:'))
        self.assertTrue(r.js_raw[0].endswith(join('static', 'js') + '" });'))
        self.assertEqual(r.css_raw, [])
        self.assertEqual(r.messages, [])

    def test_relative(self):
        r = resources.Resources(mode="relative")
        self.assertEqual(r.mode, "relative")
        self.assertEqual(r.dev, False)

        self.assertEqual(r.js_raw, [DEFAULT_JOG_JS_RAW])
        self.assertEqual(r.css_raw, [])
        self.assertEqual(r.messages, [])

    def test_relative_dev(self):
        r = resources.Resources(mode="relative-dev")
        self.assertEqual(r.mode, "relative")
        self.assertEqual(r.dev, True)

        self.assertEqual(len(r.js_raw), 1)
        self.assertTrue(r.js_raw[0].startswith('require.config({ baseUrl:'))
        self.assertTrue(r.js_raw[0].endswith(join('static', 'js') + '" });'))
        self.assertEqual(r.css_raw, [])
        self.assertEqual(r.messages, [])

    def test_absolute(self):
        r = resources.Resources(mode="absolute")
        self.assertEqual(r.mode, "absolute")
        self.assertEqual(r.dev, False)

        self.assertEqual(r.js_raw, [DEFAULT_JOG_JS_RAW])
        self.assertEqual(r.css_raw, [])
        self.assertEqual(r.messages, [])

    def test_absolute_dev(self):
        r = resources.Resources(mode="absolute-dev")
        self.assertEqual(r.mode, "absolute")
        self.assertEqual(r.dev, True)

        self.assertEqual(len(r.js_raw), 1)
        self.assertTrue(r.js_raw[0].startswith('require.config({ baseUrl:'))
        self.assertTrue(r.js_raw[0].endswith(join('static', 'js') + '" });'))
        self.assertEqual(r.css_raw, [])
        self.assertEqual(r.messages, [])

    def test_argument_checks(self):
        self.assertRaises(ValueError, resources.Resources, "foo")

        for mode in ("inline", "cdn", "server", "server-dev", "absolute", "absolute-dev"):
            self.assertRaises(ValueError, resources.Resources, mode, root_dir="foo")

        for mode in ("inline", "server", "server-dev", "relative", "relative-dev", "absolute", "absolute-dev"):
            self.assertRaises(ValueError, resources.Resources, mode, version="foo")

        for mode in ("inline", "cdn", "relative", "relative-dev", "absolute", "absolute-dev"):
            self.assertRaises(ValueError, resources.Resources, mode, root_url="foo")

    def test_js_wrapper(self):
        for mode in ("inline", "server", "cdn", "relative", "absolute"):
            r = resources.Resources(mode)
            self.assertEqual(r.js_wrapper("foo"), WRAPPER)

        for mode in ("server-dev", "relative-dev", "absolute-dev"):
            r = resources.Resources(mode)
            self.assertEqual(r.js_wrapper("foo"), WRAPPER_DEV)
