#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import asyncio
import json
import logging
import threading
from unittest.mock import Mock, patch

# External imports
from _util_server import http_get, url
from tornado.web import StaticFileHandler
from tornado.websocket import WebSocketClosedError

# Bokeh imports
from bokeh.application import Application
from bokeh.application.handlers.function import FunctionHandler
from bokeh.client import pull_session
from bokeh.core.types import ID
from bokeh.server.auth_provider import NullAuth
from bokeh.server.views.static_handler import StaticHandler
from bokeh.server.views.ws import WSHandler
from tests.support.plugins.managed_server_loop import MSL
from tests.support.util.env import envset

# Module under test
import bokeh.server.tornado as bst # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

logging.basicConfig(level=logging.DEBUG)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_default_resources(ManagedServerLoop: MSL) -> None:
    application = Application()

    with ManagedServerLoop(application) as server:
        r = server._tornado.resources()
        assert r.mode == "server"
        assert r.root_url == "/"
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


    with ManagedServerLoop(application) as server:
        r = server._tornado.resources(absolute_url=True)
        assert r.mode == "server"
        assert r.root_url == f"http://localhost:{server.port}/"
        assert r.path_versioner == StaticHandler.append_version

    with ManagedServerLoop(application, prefix="/foo/") as server:
        r = server._tornado.resources(absolute_url=True)
        assert r.mode == "server"
        assert r.root_url == f"http://localhost:{server.port}/foo/"
        assert r.path_versioner == StaticHandler.append_version

    with ManagedServerLoop(application, prefix="foo/") as server:
        r = server._tornado.resources(absolute_url=True)
        assert r.mode == "server"
        assert r.root_url == f"http://localhost:{server.port}/foo/"
        assert r.path_versioner == StaticHandler.append_version

    with ManagedServerLoop(application, prefix="foo") as server:
        r = server._tornado.resources(absolute_url=True)
        assert r.mode == "server"
        assert r.root_url == f"http://localhost:{server.port}/foo/"
        assert r.path_versioner == StaticHandler.append_version

    with ManagedServerLoop(application, prefix="/foo") as server:
        r = server._tornado.resources(absolute_url=True)
        assert r.mode == "server"
        assert r.root_url == f"http://localhost:{server.port}/foo/"
        assert r.path_versioner == StaticHandler.append_version

    with ManagedServerLoop(application, prefix="/foo/bar") as server:
        r = server._tornado.resources(absolute_url=True)
        assert r.mode == "server"
        assert r.root_url == f"http://localhost:{server.port}/foo/bar/"
        assert r.path_versioner == StaticHandler.append_version

def test_env_resources(ManagedServerLoop: MSL) -> None:
    with envset(BOKEH_RESOURCES="cdn"):
        application = Application()
        with ManagedServerLoop(application) as server:
            r = server._tornado.resources()
            assert r.mode == "cdn"

def test_dev_resources(ManagedServerLoop: MSL) -> None:
    with envset(BOKEH_DEV="yes"):
        application = Application()
        with ManagedServerLoop(application) as server:
            r = server._tornado.resources()
            assert r.mode == "server"
            assert r.dev

def test_index(ManagedServerLoop: MSL) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        assert server._tornado.index is None

    with ManagedServerLoop(application, index='foo') as server:
        assert server._tornado.index == "foo"

def test_prefix(ManagedServerLoop: MSL) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        assert server._tornado.prefix == ""

    for prefix in ["foo", "/foo", "/foo/", "foo/"]:
        with ManagedServerLoop(application, prefix=prefix) as server:
            assert server._tornado.prefix == "/foo"

def test_xsrf_cookies() -> None:
    bt = bst.BokehTornado(applications={})
    assert not bt.settings['xsrf_cookies']

    bt = bst.BokehTornado(applications={}, xsrf_cookies=True)
    assert bt.settings['xsrf_cookies']

def test_auth_provider() -> None:
    bt = bst.BokehTornado(applications={})
    assert isinstance(bt.auth_provider, NullAuth)

    class FakeAuth:
        get_user = "get_user"
        endpoints = []
    bt = bst.BokehTornado(applications={}, auth_provider=FakeAuth)
    assert bt.auth_provider is FakeAuth

def test_logout_url_prefix() -> None:
    class FakeAuth:
        get_user = None
        get_user_async = None
        login_url = None
        logout_url = "/logout"
        endpoints = []

    # no prefix
    bt = bst.BokehTornado({"/": Application()}, auth_provider=FakeAuth)
    assert bt._applications["/"]._logout_url == "/logout"

    # with prefix
    bt = bst.BokehTornado({"/": Application()}, prefix="/pre", auth_provider=FakeAuth)
    assert bt._applications["/"]._logout_url == "/pre/logout"

    # prefix is normalized first, so surrounding slashes collapse to the same result
    for prefix in ["pre", "/pre", "/pre/", "pre/"]:
        bt = bst.BokehTornado({"/": Application()}, prefix=prefix, auth_provider=FakeAuth)
        assert bt._applications["/"]._logout_url == "/pre/logout"

    # multi-part prefix
    bt = bst.BokehTornado({"/": Application()}, prefix="/a/b", auth_provider=FakeAuth)
    assert bt._applications["/"]._logout_url == "/a/b/logout"

    # no-leading-slash suffix
    class FakeAuthNoSlash(FakeAuth):
        logout_url = "logout"

    bt = bst.BokehTornado({"/": Application()}, prefix="/pre", auth_provider=FakeAuthNoSlash)
    assert bt._applications["/"]._logout_url == "/pre/logout"

def test_websocket_max_message_size_bytes() -> None:
    app = Application()
    t = bst.BokehTornado({"/": app}, websocket_max_message_size_bytes=12345)
    assert t.settings['websocket_max_message_size'] == 12345

def test_websocket_compression_level() -> None:
    app = Application()
    t = bst.BokehTornado({"/": app}, websocket_compression_level=2,
                             websocket_compression_mem_level=3)
    ws_rules = [rule for rule in t.wildcard_router.rules if issubclass(rule.target, WSHandler)]
    assert len(ws_rules) == 1
    ws_rule = ws_rules[0]
    assert ws_rule.target_kwargs.get('compression_level') == 2
    assert ws_rule.target_kwargs.get('mem_level') == 3

def test_websocket_origins(ManagedServerLoop, unused_tcp_port) -> None:
    application = Application()
    with ManagedServerLoop(application, port=unused_tcp_port) as server:
        assert server._tornado.websocket_origins == {f"localhost:{unused_tcp_port}"}

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
    t = bst.BokehTornado({}, prefix="", extra_websocket_origins=[])
    assert t.app_paths == set()

    t = bst.BokehTornado({"/": app}, prefix="", extra_websocket_origins=[])
    assert t.app_paths == { "/" }

    t = bst.BokehTornado({"/": app, "/foo": app}, prefix="", extra_websocket_origins=[])
    assert t.app_paths == { "/", "/foo"}

def test_stop_cancels_pending_sessions_before_unload() -> None:
    t = bst.BokehTornado({"/": Application()})
    context = t._applications["/"]
    calls = []
    context._cancel_pending_sessions = Mock(side_effect=lambda: calls.append("cancel") or ())
    context.run_unload_hook = Mock(side_effect=lambda: calls.append("unload"))
    t._stats_job = Mock()
    t._mem_job = None
    t._cleanup_job = Mock()
    t._ping_job = None
    t._clients = set()

    t.stop()

    assert calls == ["cancel", "unload"]


async def test_stop_defers_unload_until_pending_worker_finishes() -> None:
    started = threading.Event()
    release = threading.Event()
    finished = threading.Event()
    unloaded = threading.Event()

    def modify_document(doc) -> None:
        started.set()
        assert release.wait(timeout=2)
        finished.set()

    handler = FunctionHandler(modify_document)
    handler.on_server_unloaded = lambda context: unloaded.set()
    t = bst.BokehTornado({"/": Application(handler)})
    t._stats_job = Mock()
    t._mem_job = None
    t._cleanup_job = Mock()
    t._ping_job = None
    t._clients = set()
    context = t._applications["/"]
    pending = asyncio.create_task(context.create_session_if_needed("session"))
    await asyncio.wait_for(asyncio.to_thread(started.wait), 1)

    stopping = asyncio.create_task(t.stop_async())
    await asyncio.sleep(0)
    assert not stopping.done()
    assert not unloaded.is_set()
    with pytest.raises(RuntimeError, match="stopping"):
        await t.create_session_if_needed(context, "late-session")
    assert "late-session" not in context._pending_sessions

    release.set()
    await stopping
    with pytest.raises(asyncio.CancelledError):
        await pending
    assert finished.is_set()
    assert unloaded.is_set()


async def test_stop_waits_for_running_cleanup_before_unload() -> None:
    t = bst.BokehTornado({"/": Application()})
    t._stats_job = Mock()
    t._mem_job = None
    t._cleanup_job = Mock()
    t._ping_job = None
    t._clients = set()
    context = t._applications["/"]
    started = asyncio.Event()
    release = asyncio.Event()
    unloaded = asyncio.Event()

    async def cleanup(unused_session_linger_milliseconds: int) -> None:
        started.set()
        await release.wait()

    context._cleanup_sessions = cleanup
    context.run_unload_hook = lambda: unloaded.set()
    cleaning = asyncio.create_task(t._cleanup_sessions())
    await asyncio.wait_for(started.wait(), 1)

    stopping = asyncio.create_task(t.stop_async())
    await asyncio.sleep(0)
    assert not stopping.done()
    assert not unloaded.is_set()

    release.set()
    await asyncio.gather(cleaning, stopping)
    assert unloaded.is_set()


async def test_concurrent_stop_async_runs_unload_once() -> None:
    t = bst.BokehTornado({"/": Application()})
    t._stats_job = Mock()
    t._mem_job = None
    t._cleanup_job = Mock()
    t._ping_job = None
    t._clients = set()
    context = t._applications["/"]
    unload_count = 0

    def unload() -> None:
        nonlocal unload_count
        unload_count += 1

    context.run_unload_hook = unload
    await asyncio.gather(t.stop_async(), t.stop_async())

    assert unload_count == 1

# tried to use capsys to test what's actually logged and it wasn't
# working, in the meantime at least this tests that log_stats
# doesn't crash in various scenarios
def test_log_stats(ManagedServerLoop: MSL) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        server._tornado._log_stats()
        session1 = pull_session(session_id=ID("session1"),
                                url=url(server),
                                io_loop=server.io_loop)
        session2 = pull_session(session_id=ID("session2"),
                                url=url(server),
                                io_loop=server.io_loop)
        server._tornado._log_stats()
        session1.close()
        session2.close()
        server._tornado._log_stats()

async def test_metadata(ManagedServerLoop: MSL) -> None:
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

def test_keep_alive_websocket_error(ManagedServerLoop: MSL) -> None:
    application = Application()
    mock_client = Mock()
    mock_client.send_ping.side_effect = WebSocketClosedError()
    with ManagedServerLoop(application, keep_alive_milliseconds=100) as server:
        with patch('bokeh.server.tornado.BokehTornado.client_lost') as client_lost:
            server._tornado._clients = {mock_client}
            server._tornado._keep_alive()
            assert client_lost.called

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Test_create_static_handler:

    def test_app_static_path(self):
        app = Application()
        app._static_path = "foo"

        result = bst.create_static_handler("/prefix", "/key", app)
        assert len(result) == 3
        assert result[0] == "/prefix/key/static/(.*)"
        assert result[1] == StaticFileHandler
        assert result[2] == {"path" : app.static_path}

        result = bst.create_static_handler("/prefix", "/", app)
        assert len(result) == 3
        assert result[0] == "/prefix/static/(.*)"
        assert result[1] == StaticFileHandler
        assert result[2] == {"path" : app.static_path}

    def test_no_app_static_path(self):
        app = Application()
        app._static_path = None

        result = bst.create_static_handler("/prefix", "/key", app)
        assert len(result) == 3
        assert result[0] == "/prefix/key/static/(.*)"
        assert result[1] == StaticHandler
        assert result[2] == {}

        result = bst.create_static_handler("/prefix", "/", app)
        assert len(result) == 3
        assert result[0] == "/prefix/static/(.*)"
        assert result[1] == StaticHandler
        assert result[2] == {}

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
