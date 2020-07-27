#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json
import logging
import os

# Bokeh imports
from _util_server import http_get, url
from bokeh.application import Application
from bokeh.client import pull_session
from bokeh.server.auth_provider import NullAuth
from bokeh.server.views.static_handler import StaticHandler

# Module under test
import bokeh.server.tornado as tornado # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

logging.basicConfig(level=logging.DEBUG)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_default_resources(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        r = server._tornado.resources()
        assert r.mode == "server"
        assert r.root_url == ""
        assert r.path_versioner == StaticHandler.append_version

    with ManagedServerLoop(application, prefix="/foo/") as server:
        r = server._tornado.resources()
        assert r.mode == "server"
        assert r.root_url == "/foo/"
        assert r.path_versioner == StaticHandler.append_version

    with ManagedServerLoop(application, prefix="foo/") as server:
        r = server._tornado.resources()
        assert r.mode == "server"
        assert r.root_url == "/foo/"
        assert r.path_versioner == StaticHandler.append_version

    with ManagedServerLoop(application, prefix="foo") as server:
        r = server._tornado.resources()
        assert r.mode == "server"
        assert r.root_url == "/foo/"
        assert r.path_versioner == StaticHandler.append_version

    with ManagedServerLoop(application, prefix="/foo") as server:
        r = server._tornado.resources()
        assert r.mode == "server"
        assert r.root_url == "/foo/"
        assert r.path_versioner == StaticHandler.append_version

    with ManagedServerLoop(application, prefix="/foo/bar") as server:
        r = server._tornado.resources()
        assert r.mode == "server"
        assert r.root_url == "/foo/bar/"
        assert r.path_versioner == StaticHandler.append_version

def test_env_resources(ManagedServerLoop) -> None:
    os.environ['BOKEH_RESOURCES'] = 'cdn'
    application = Application()
    with ManagedServerLoop(application) as server:
        r = server._tornado.resources()
        assert r.mode == "cdn"
    del os.environ['BOKEH_RESOURCES']

def test_dev_resources(ManagedServerLoop) -> None:
    os.environ['BOKEH_DEV'] = 'yes'
    application = Application()
    with ManagedServerLoop(application) as server:
        r = server._tornado.resources()
        assert r.mode == "absolute"
        assert r.dev
    del os.environ['BOKEH_DEV']

def test_index(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        assert server._tornado.index is None

    with ManagedServerLoop(application, index='foo') as server:
        assert server._tornado.index == "foo"

def test_prefix(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        assert server._tornado.prefix == ""

    for prefix in ["foo", "/foo", "/foo/", "foo/"]:
        with ManagedServerLoop(application, prefix=prefix) as server:
            assert server._tornado.prefix == "/foo"

def test_xsrf_cookies() -> None:
    bt = tornado.BokehTornado(applications={})
    assert not bt.settings['xsrf_cookies']

    bt = tornado.BokehTornado(applications={}, xsrf_cookies=True)
    assert bt.settings['xsrf_cookies']

def test_auth_provider() -> None:
    bt = tornado.BokehTornado(applications={})
    assert isinstance(bt.auth_provider, NullAuth)

    class FakeAuth:
        get_user = "get_user"
        endpoints = []
    bt = tornado.BokehTornado(applications={}, auth_provider=FakeAuth)
    assert bt.auth_provider is FakeAuth

def test_websocket_max_message_size_bytes() -> None:
    app = Application()
    t = tornado.BokehTornado({"/": app}, websocket_max_message_size_bytes=12345)
    assert t.settings['websocket_max_message_size'] == 12345

def test_websocket_origins(ManagedServerLoop, unused_tcp_port) -> None:
    application = Application()
    with ManagedServerLoop(application, port=unused_tcp_port) as server:
        assert server._tornado.websocket_origins == {"localhost:%s" % unused_tcp_port}

    # OK this is a bit of a confusing mess. The user-facing arg for server is
    # "allow_websocket_origin" which gets converted to "extra_websocket_origins"
    # for BokehTornado, which is exposed as a property "websocket_origins"...
    with ManagedServerLoop(application, allow_websocket_origin=["foo"]) as server:
        assert server._tornado.websocket_origins == {"foo:80"}

    with ManagedServerLoop(application, allow_websocket_origin=["foo:8080"]) as server:
        assert server._tornado.websocket_origins == {"foo:8080"}

    with ManagedServerLoop(application, allow_websocket_origin=["foo:8080", "bar"]) as server:
        assert server._tornado.websocket_origins == {"foo:8080", "bar:80"}

def test_default_app_paths() -> None:
    app = Application()
    t = tornado.BokehTornado({}, "", [])
    assert t.app_paths == set()

    t = tornado.BokehTornado({"/": app}, "", [])
    assert t.app_paths == { "/" }

    t = tornado.BokehTornado({"/": app, "/foo": app}, "", [])
    assert t.app_paths == { "/", "/foo"}

# tried to use capsys to test what's actually logged and it wasn't
# working, in the meantime at least this tests that log_stats
# doesn't crash in various scenarios
def test_log_stats(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        server._tornado._log_stats()
        session1 = pull_session(session_id='session1',
                                url=url(server),
                                io_loop=server.io_loop)
        session2 = pull_session(session_id='session2',
                                url=url(server),
                                io_loop=server.io_loop)
        server._tornado._log_stats()
        session1.close()
        session2.close()
        server._tornado._log_stats()

async def test_metadata(ManagedServerLoop) -> None:
    application = Application(metadata=dict(hi="hi", there="there"))
    with ManagedServerLoop(application) as server:
        meta_url = url(server) + 'metadata'
        meta_resp = await http_get(server.io_loop, meta_url)
        meta_json = json.loads(meta_resp.buffer.read().decode())
        assert meta_json == {'data': {'hi': 'hi', 'there': 'there'}, 'url': '/'}

    def meta_func():
        return dict(name='myname', value='no value')

    application1 = Application(metadata=meta_func)

    with ManagedServerLoop(application1) as server:
        meta_url = url(server) + 'metadata'
        meta_resp = await http_get(server.io_loop, meta_url)
        meta_json = json.loads(meta_resp.buffer.read().decode())
        assert meta_json == {'data': {'name': 'myname', 'value': 'no value'}, 'url': '/'}

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
