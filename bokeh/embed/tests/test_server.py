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

# External imports
import bs4

# Bokeh imports

# Module under test
import bokeh.embed.server as bes

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

@pytest.fixture
def test_plot():
    from bokeh.plotting import figure
    test_plot = figure()
    test_plot.circle([1, 2], [2, 3])
    return test_plot

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestServerDocument(object):

    def test_invalid_resources_param(self):
        with pytest.raises(ValueError):
            bes.server_document(url="http://localhost:8081/foo/bar/sliders", resources=123)
        with pytest.raises(ValueError):
            bes.server_document(url="http://localhost:8081/foo/bar/sliders", resources="whatever")

    def test_resources_default_is_implicit(self):
        r = bes.server_document(url="http://localhost:8081/foo/bar/sliders", resources="default")
        assert 'resources=' not in r

    def test_resources_none(self):
        r = bes.server_document(url="http://localhost:8081/foo/bar/sliders", resources=None)
        assert 'resources=none' in r

    def test_general(self):
        r = bes.server_document(url="http://localhost:8081/foo/bar/sliders")
        assert 'bokeh-app-path=/foo/bar/sliders' in r
        assert 'bokeh-absolute-url=http://localhost:8081/foo/bar/sliders' in r
        html = bs4.BeautifulSoup(r, "lxml")
        scripts = html.findAll(name='script')
        assert len(scripts) == 1
        attrs = scripts[0].attrs
        assert set(attrs), set([
            'src',
            'id'
        ])
        divid = attrs['id']
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-app-path=/foo/bar/sliders&bokeh-absolute-url=%s" % \
              ("http://localhost:8081/foo/bar/sliders", divid, "http://localhost:8081/foo/bar/sliders")
        assert attrs == { 'id' : divid,
                          'src' : src }

    def test_script_attrs_arguments_provided(self):
        r = bes.server_document(arguments=dict(foo=10))
        assert 'foo=10' in r
        html = bs4.BeautifulSoup(r, "lxml")
        scripts = html.findAll(name='script')
        assert len(scripts) == 1
        attrs = scripts[0].attrs
        assert set(attrs) == set([
            'src',
            'id'
        ])
        divid = attrs['id']
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-absolute-url=%s&foo=10" % \
              ("http://localhost:5006", divid, "http://localhost:5006")
        assert attrs == { 'id' : divid,
                          'src' : src }

    def test_script_attrs_url_provided_absolute_resources(self):
        r = bes.server_document(url="http://localhost:8081/foo/bar/sliders")
        assert 'bokeh-app-path=/foo/bar/sliders' in r
        assert 'bokeh-absolute-url=http://localhost:8081/foo/bar/sliders' in r
        html = bs4.BeautifulSoup(r, "lxml")
        scripts = html.findAll(name='script')
        assert len(scripts) == 1
        attrs = scripts[0].attrs
        assert set(attrs) == set([
            'src',
            'id'
        ])
        divid = attrs['id']
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-app-path=/foo/bar/sliders&bokeh-absolute-url=%s" % \
              ("http://localhost:8081/foo/bar/sliders", divid, "http://localhost:8081/foo/bar/sliders")
        assert attrs == { 'id' : divid,
                          'src' : src }

    def test_script_attrs_url_provided(self):
        r = bes.server_document(url="http://localhost:8081/foo/bar/sliders", relative_urls=True)
        assert 'bokeh-app-path=/foo/bar/sliders' in r
        html = bs4.BeautifulSoup(r, "lxml")
        scripts = html.findAll(name='script')
        assert len(scripts) == 1
        attrs = scripts[0].attrs
        assert set(attrs) == set([
            'src',
            'id'
        ])
        divid = attrs['id']
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-app-path=/foo/bar/sliders" % \
              ("http://localhost:8081/foo/bar/sliders", divid)
        assert attrs == { 'id' : divid,
                          'src' : src }

class TestServerSession(object):

    def test_return_type(self, test_plot):
        r = bes.server_session(test_plot, session_id='fakesession')
        assert isinstance(r, str)

    def test_script_attrs_session_id_provided(self, test_plot):
        r = bes.server_session(test_plot, session_id='fakesession')
        assert 'bokeh-session-id=fakesession' in r
        html = bs4.BeautifulSoup(r, "lxml")
        scripts = html.findAll(name='script')
        assert len(scripts) == 1
        attrs = scripts[0].attrs
        assert set(attrs) == set([
            'src',
            'id'
        ])
        divid = attrs['id']
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-absolute-url=%s&bokeh-session-id=fakesession" % \
              ("http://localhost:5006", divid, "http://localhost:5006")
        assert attrs == { 'id' : divid,
                          'src' : src }

    def test_invalid_resources_param(self, test_plot):
        with pytest.raises(ValueError):
            bes.server_session(test_plot, session_id='fakesession', resources=123)
        with pytest.raises(ValueError):
            bes.server_session(test_plot, session_id='fakesession', resources="whatever")

    def test_resources_default_is_implicit(self, test_plot):
        r = bes.server_session(test_plot, session_id='fakesession', resources="default")
        assert 'resources=' not in r

    def test_resources_none(self, test_plot):
        r = bes.server_session(test_plot, session_id='fakesession', resources=None)
        assert 'resources=none' in r

    def test_model_none(self):
        r = bes.server_session(None, session_id='fakesession')
        html = bs4.BeautifulSoup(r, "lxml")
        scripts = html.findAll(name='script')
        assert len(scripts) == 1
        attrs = scripts[0].attrs
        assert set(attrs), set([
            'src',
            'id'
        ])
        divid = attrs['id']
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-absolute-url=%s&bokeh-session-id=fakesession" % \
              ("http://localhost:5006", divid, "http://localhost:5006")
        assert attrs == { 'id' : divid,
                          'src' : src }

    def test_general(self, test_plot):
        r = bes.server_session(test_plot, session_id='fakesession')
        assert 'bokeh-session-id=fakesession' in r
        html = bs4.BeautifulSoup(r, "lxml")
        scripts = html.findAll(name='script')
        assert len(scripts) == 1
        attrs = scripts[0].attrs
        assert set(attrs), set([
            'src',
            'id'
        ])
        divid = attrs['id']
        src = "%s/autoload.js?bokeh-autoload-element=%s&bokeh-absolute-url=%s&bokeh-session-id=fakesession" % \
              ("http://localhost:5006", divid, "http://localhost:5006")
        assert attrs == { 'id' : divid,
                          'src' : src }

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class Test__clean_url(object):

    def test_default(self):
        assert bes._clean_url("default") == bes.DEFAULT_SERVER_HTTP_URL.rstrip("/")

    def test_bad_ws(self):
        with pytest.raises(ValueError):
            bes._clean_url("ws://foo")

    def test_arg(self):
        assert bes._clean_url("http://foo/bar") == "http://foo/bar"
        assert bes._clean_url("http://foo/bar/") == "http://foo/bar"

class Test__get_app_path(object):

    def test_arg(self):
        assert bes._get_app_path("foo") == "/foo"
        assert bes._get_app_path("http://foo") == "/"
        assert bes._get_app_path("http://foo/bar") == "/bar"
        assert bes._get_app_path("https://foo") == "/"
        assert bes._get_app_path("https://foo/bar") == "/bar"

class Test__process_arguments(object):

    def test_None(self):
        assert bes._process_arguments(None) == ""

    def test_args(self):
        args = dict(foo=10, bar="baz")
        r = bes._process_arguments(args)
        # order unspecified
        assert r == "&foo=10&bar=baz" or r == "&bar=baz&foo=10"

    def test_args_ignores_bokeh_prefixed(self):
        args = dict(foo=10, bar="baz")
        args["bokeh-junk"] = 20
        r = bes._process_arguments(args)
        # order unspecified
        assert r == "&foo=10&bar=baz" or r == "&bar=baz&foo=10"

class Test__process_app_path(object):

    def test_root(self):
        assert bes._process_app_path("/") == ""

    def test_arg(self):
        assert bes._process_app_path("/stuff") == "&bokeh-app-path=/stuff"

class Test__process_relative_urls(object):

    def test_True(self):
        assert bes._process_relative_urls(True, "") == ""
        assert bes._process_relative_urls(True, "/stuff") == ""

    def test_Flase(self):
        assert bes._process_relative_urls(False, "/stuff") == "&bokeh-absolute-url=/stuff"

class Test__process_resources(object):

    def test_bad_input(self):
        with pytest.raises(ValueError):
            bes._process_resources("foo")

    def test_None(self):
        assert bes._process_resources(None) == "&resources=none"

    def test_default(self):
        assert bes._process_resources("default") == ""

class Test__process_session_id(object):

    def test_arg(self):
        assert bes._process_session_id("foo123") == "&bokeh-session-id=foo123"

def Test__src_path(object):

    def test_args(self):
        assert bes._src_path("http://foo", "1234") =="http://foo/autoload.js?bokeh-autoload-element=1234"

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
