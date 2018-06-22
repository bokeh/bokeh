from __future__ import absolute_import

import os

import pytest

import bokeh.resources as resources
from bokeh.models import Model
from bokeh.resources import _get_cdn_urls

# if BOKEH_RESOURCES is set many tests in this file fail
if os.environ.get("BOKEH_RESOURCES"):
    raise RuntimeError("Cannot run the unit tests with BOKEH_RESOURCES set")

LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']

DEFAULT_LOG_JS_RAW = 'Bokeh.set_log_level("info");'

## Test JSResources

def test_js_resources_default_mode_is_inline():
    r = resources.JSResources()
    assert r.mode == "inline"


def test_js_resources_inline_has_no_css_resources():
    r = resources.JSResources(mode="inline")
    assert r.mode == "inline"
    assert r.dev is False

    assert len(r.js_raw) == 5
    assert r.js_raw[-1] == DEFAULT_LOG_JS_RAW
    assert hasattr(r, 'css_raw') is False
    assert r.messages == []


## Test CSSResources

def test_css_resources_default_mode_is_inline():
    r = resources.CSSResources()
    assert r.mode == "inline"


def test_inline_css_resources():
    r = resources.CSSResources(mode="inline")
    assert r.mode == "inline"
    assert r.dev is False

    assert len(r.css_raw) == 3
    assert hasattr(r, 'js_raw') is False
    assert r.messages == []


class TestResources(object):

    def test_basic(self):
        r = resources.Resources()
        assert r.mode == "inline"

    def test_log_level(self):
        r = resources.Resources()
        for level in LOG_LEVELS:
            r.log_level = level
            assert r.log_level == level
            if not r.dev:
                assert r.js_raw[-1] == 'Bokeh.set_log_level("%s");' % level
        with pytest.raises(ValueError):
            setattr(r, "log_level", "foo")

    def test_module_attrs(self):
        assert resources.CDN.mode == "cdn"
        assert resources.INLINE.mode == "inline"

    def test_inline(self):
        r = resources.Resources(mode="inline")
        assert r.mode == "inline"
        assert r.dev == False

        assert len(r.js_raw) == 5
        assert r.js_raw[-1] == DEFAULT_LOG_JS_RAW
        assert len(r.css_raw) == 3
        assert r.messages == []

    def test_get_cdn_urls(self):
        dev_version = "0.0.1dev2"
        result = _get_cdn_urls(version=dev_version)
        url = result['urls'](["bokeh"], 'js')[0]
        assert 'bokeh/dev' in url

    def test_cdn(self):
        resources.__version__ = "1.0"
        r = resources.Resources(mode="cdn", version="1.0")
        assert r.mode == "cdn"
        assert r.dev == False

        assert r.js_raw == [DEFAULT_LOG_JS_RAW]
        assert r.css_raw == []
        assert r.messages == []

        resources.__version__ = "1.0-1-abc"
        r = resources.Resources(mode="cdn", version="1.0")
        assert r.messages == [{
            'text': "Requesting CDN BokehJS version '1.0' from Bokeh development version '1.0-1-abc'. This configuration is unsupported and may not work!",
            'type': 'warn'}
        ]

    def test_server_default(self):
        r = resources.Resources(mode="server")
        assert r.mode == "server"
        assert r.dev == False

        assert r.js_raw == [DEFAULT_LOG_JS_RAW]
        assert r.css_raw == []
        assert r.messages == []

        assert r.js_files == ['http://localhost:5006/static/js/bokeh.min.js',
                              'http://localhost:5006/static/js/bokeh-widgets.min.js',
                              'http://localhost:5006/static/js/bokeh-tables.min.js',
                              'http://localhost:5006/static/js/bokeh-gl.min.js']

        assert r.css_files == ['http://localhost:5006/static/css/bokeh.min.css',
                               'http://localhost:5006/static/css/bokeh-widgets.min.css',
                               'http://localhost:5006/static/css/bokeh-tables.min.css']

    def test_server_root_url(self):
        r = resources.Resources(mode="server", root_url="http://foo/")

        assert r.js_raw == [DEFAULT_LOG_JS_RAW]
        assert r.css_raw == []
        assert r.messages == []

        assert r.js_files == ['http://foo/static/js/bokeh.min.js',
                              'http://foo/static/js/bokeh-widgets.min.js',
                              'http://foo/static/js/bokeh-tables.min.js',
                              'http://foo/static/js/bokeh-gl.min.js']

        assert r.css_files == ['http://foo/static/css/bokeh.min.css',
                               'http://foo/static/css/bokeh-widgets.min.css',
                               'http://foo/static/css/bokeh-tables.min.css']

    def test_server_root_url_empty(self):
        r = resources.Resources(mode="server", root_url="")

        assert r.js_raw == [DEFAULT_LOG_JS_RAW]
        assert r.css_raw == []
        assert r.messages == []

        assert r.js_files == ['static/js/bokeh.min.js',
                              'static/js/bokeh-widgets.min.js',
                              'static/js/bokeh-tables.min.js',
                              'static/js/bokeh-gl.min.js']

        assert r.css_files == ['static/css/bokeh.min.css',
                               'static/css/bokeh-widgets.min.css',
                               'static/css/bokeh-tables.min.css']


    def test_server_with_versioner(self):
        def versioner(path):
            return path + "?v=VERSIONED"

        r = resources.Resources(mode="server", root_url="http://foo/",
                                path_versioner=versioner)

        assert r.js_files == ['http://foo/static/js/bokeh.min.js?v=VERSIONED',
                              'http://foo/static/js/bokeh-widgets.min.js?v=VERSIONED',
                              'http://foo/static/js/bokeh-tables.min.js?v=VERSIONED',
                              'http://foo/static/js/bokeh-gl.min.js?v=VERSIONED']

        assert r.css_files == ['http://foo/static/css/bokeh.min.css?v=VERSIONED',
                               'http://foo/static/css/bokeh-widgets.min.css?v=VERSIONED',
                               'http://foo/static/css/bokeh-tables.min.css?v=VERSIONED']

    def test_server_dev(self):
        r = resources.Resources(mode="server-dev")
        assert r.mode == "server"
        assert r.dev == True

        assert len(r.js_raw) == 2
        assert r.css_raw == []
        assert r.messages == []

        r = resources.Resources(mode="server-dev", root_url="http://foo/")

        assert r.js_raw == [DEFAULT_LOG_JS_RAW, "Bokeh.settings.dev = true"]
        assert r.css_raw == []
        assert r.messages == []

    def test_relative(self):
        r = resources.Resources(mode="relative")
        assert r.mode == "relative"
        assert r.dev == False

        assert r.js_raw == [DEFAULT_LOG_JS_RAW]
        assert r.css_raw == []
        assert r.messages == []

    def test_relative_dev(self):
        r = resources.Resources(mode="relative-dev")
        assert r.mode == "relative"
        assert r.dev == True

        assert r.js_raw == [DEFAULT_LOG_JS_RAW, "Bokeh.settings.dev = true"]
        assert r.css_raw == []
        assert r.messages == []

    def test_absolute(self):
        r = resources.Resources(mode="absolute")
        assert r.mode == "absolute"
        assert r.dev == False

        assert r.js_raw == [DEFAULT_LOG_JS_RAW]
        assert r.css_raw == []
        assert r.messages == []

    def test_absolute_dev(self):
        r = resources.Resources(mode="absolute-dev")
        assert r.mode == "absolute"
        assert r.dev == True

        assert r.js_raw == [DEFAULT_LOG_JS_RAW, "Bokeh.settings.dev = true"]
        assert r.css_raw == []
        assert r.messages == []

    def test_argument_checks(self):
        with pytest.raises(ValueError):
            resources.Resources("foo")

        for mode in ("inline", "cdn", "server", "server-dev", "absolute", "absolute-dev"):
            with pytest.raises(ValueError):
                resources.Resources(mode, root_dir="foo")

        for mode in ("inline", "server", "server-dev", "relative", "relative-dev", "absolute", "absolute-dev"):
            with pytest.raises(ValueError):
                resources.Resources(mode, version="foo")

        for mode in ("inline", "cdn", "relative", "relative-dev", "absolute", "absolute-dev"):
            with pytest.raises(ValueError):
                resources.Resources(mode, root_url="foo")


## Test external resources

def test_external_js_and_css_resource_embedding():
    """ This test method has to be at the end of the test modules because
    subclassing a Model causes the CustomModel to be added as a MetaModel and
    messes up the Resources state for the other tests.
    """

    # External resources can be defined as a string or list of strings
    class CustomModel1(Model):
        __javascript__ = "external_js_1"
        __css__ = "external_css_1"

    class CustomModel2(Model):
        __javascript__ = ["external_js_2", "external_js_3"]
        __css__ = ["external_css_2", "external_css_3"]

    class CustomModel3(Model):
        __javascript__ = ["external_js_1", "external_js_3"]
        __css__ = ["external_css_1", "external_css_2"]

    r = resources.Resources()

    assert "external_js_1" in r.js_files
    assert "external_css_1" in r.css_files

    assert "external_js_2" in r.js_files
    assert "external_js_3" in r.js_files
    assert "external_css_2" in r.css_files
    assert "external_css_3" in r.css_files

    # Deduplication should keep the first instance of every file
    assert r.css_files.count("external_css_1") == 1
    assert r.css_files.count("external_css_2") == 1
    assert r.js_files.count("external_js_3") == 1
    assert r.js_files.count("external_js_1") == 1


def test_external_js_and_css_resource_ordering():
    class ZClass(Model):
        __javascript__ = "z_class"

    class AClass(Model):
        __javascript__ = "a_class"

    r = resources.Resources()

    # a_class is before z_class because they're sorted alphabetically
    assert r.js_files.index("a_class") < r.js_files.index("z_class")

    # The files should be in the order defined by the lists in CustomModel2 and CustomModel3
    assert r.css_files.index("external_css_3") > r.css_files.index("external_css_2")
    assert r.js_files.index("external_js_3") > r.js_files.index("external_js_2")
