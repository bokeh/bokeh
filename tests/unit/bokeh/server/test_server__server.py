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
import asyncio
import logging
import re
import ssl
import sys
import time
from datetime import timedelta

# External imports
import mock
from flaky import flaky
from tornado.httpclient import HTTPError
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop, PeriodicCallback

# Bokeh imports
from _util_server import http_get, url, websocket_open, ws_url
from bokeh.application import Application
from bokeh.application.handlers import Handler
from bokeh.client import pull_session
from bokeh.core.properties import List, String
from bokeh.model import Model
from bokeh.server.server import BaseServer, Server
from bokeh.server.tornado import BokehTornado
from bokeh.util.token import (
    check_token_signature,
    generate_jwt_token,
    get_session_id,
    get_token_payload,
)

# Module under test
import bokeh.server.server as server # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

logging.basicConfig(level=logging.DEBUG)

async def async_value(value):
    await asyncio.sleep(0) # this ensures we actually return to the loop
    return value

class HookListModel(Model):
    hooks = List(String)

class HookTestHandler(Handler):
    def __init__(self):
        super().__init__()
        self.load_count = 0
        self.unload_count = 0
        self.session_creation_async_value = 0
        self.hooks = []
        self.server_periodic_remover = None
        self.session_periodic_remover = None

    def modify_document(self, doc):
        # this checks that the session created hook has run
        # and session destroyed has not.
        assert self.session_creation_async_value == 3
        doc.title = "Modified"
        doc.roots[0].hooks.append("modify")
        self.hooks.append("modify")

    def on_server_loaded(self, server_context):
        assert len(server_context.sessions) == 0
        self.load_count += 1
        self.hooks.append("server_loaded")

        server_context.add_next_tick_callback(self.on_next_tick_server)
        server_context.add_timeout_callback(self.on_timeout_server, 2)
        periodic_cb_id = server_context.add_periodic_callback(self.on_periodic_server, 3)

        def remover():
            server_context.remove_periodic_callback(periodic_cb_id)

        self.server_periodic_remover = remover

    def on_server_unloaded(self, server_context):
        self.unload_count += 1
        self.hooks.append("server_unloaded")

    # important to test that this can be async
    async def on_session_created(self, session_context):
        async def setup_document(doc):
            # session creation hook is allowed to init the document
            # before any modify_document() handlers kick in
            from bokeh.document import DEFAULT_TITLE
            hook_list = HookListModel()
            assert doc.title == DEFAULT_TITLE
            assert len(doc.roots) == 0
            hook_list.hooks.append("session_created")
            doc.add_root(hook_list)

            self.session_creation_async_value = await async_value(1)
            self.session_creation_async_value = await async_value(2)
            self.session_creation_async_value = await async_value(3)

        await session_context.with_locked_document(setup_document)

        server_context = session_context.server_context
        server_context.add_next_tick_callback(self.on_next_tick_session)
        server_context.add_timeout_callback(self.on_timeout_session, 2)
        periodic_cb_id = server_context.add_periodic_callback(self.on_periodic_session, 3)

        def remover():
            server_context.remove_periodic_callback(periodic_cb_id)

        self.session_periodic_remover = remover

        self.hooks.append("session_created")

    # this has to be async too
    async def on_session_destroyed(self, session_context):
        # this should be no-op'd, because the session is already destroyed
        async def shutdown_document(doc):
            doc.roots[0].hooks.append("session_destroyed")
            self.session_creation_async_value = await async_value(4)
            self.session_creation_async_value = await async_value(5)
            self.session_creation_async_value = await async_value(6)
        await session_context.with_locked_document(shutdown_document)

        self.hooks.append("session_destroyed")

    def on_next_tick_server(self):
        self.hooks.append("next_tick_server")

    def on_timeout_server(self):
        self.hooks.append("timeout_server")

    def on_periodic_server(self):
        self.hooks.append("periodic_server")
        self.server_periodic_remover()

    def on_next_tick_session(self):
        self.hooks.append("next_tick_session")

    def on_timeout_session(self):
        self.hooks.append("timeout_session")

    def on_periodic_session(self):
        self.hooks.append("periodic_session")
        self.session_periodic_remover()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_prefix(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        assert server.prefix == ""

    with ManagedServerLoop(application, prefix="foo") as server:
        assert server.prefix == "/foo"

def test_index(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        assert server.index is None

    with ManagedServerLoop(application, index="foo") as server:
        assert server.index == "foo"

async def test_get_sessions(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        server_sessions = server.get_sessions('/')
        assert len(server_sessions) == 0

        await http_get(server.io_loop, url(server))
        server_sessions = server.get_sessions('/')
        assert len(server_sessions) == 1

        await http_get(server.io_loop, url(server))
        server_sessions = server.get_sessions('/')
        assert len(server_sessions) == 2

        server_sessions = server.get_sessions()
        assert len(server_sessions) == 2

        with pytest.raises(ValueError):
            server.get_sessions("/foo")

    with ManagedServerLoop({"/foo": application, "/bar": application}) as server:
        await http_get(server.io_loop, url(server) + "foo")
        server_sessions = server.get_sessions('/foo')
        assert len(server_sessions) == 1
        server_sessions = server.get_sessions('/bar')
        assert len(server_sessions) == 0
        server_sessions = server.get_sessions()
        assert len(server_sessions) == 1


        await http_get(server.io_loop, url(server) + "foo")
        server_sessions = server.get_sessions('/foo')
        assert len(server_sessions) == 2
        server_sessions = server.get_sessions('/bar')
        assert len(server_sessions) == 0
        server_sessions = server.get_sessions()
        assert len(server_sessions) == 2

        await http_get(server.io_loop, url(server) + "bar")
        server_sessions = server.get_sessions('/foo')
        assert len(server_sessions) == 2
        server_sessions = server.get_sessions('/bar')
        assert len(server_sessions) == 1
        server_sessions = server.get_sessions()
        assert len(server_sessions) == 3

# examples:
# "sessionid" : "NzlNoPfEYJahnPljE34xI0a5RSTaU1Aq1Cx5"
# 'sessionid':'NzlNoPfEYJahnPljE34xI0a5RSTaU1Aq1Cx5'
token_in_json = re.compile("""["']token["'] *: *["']([^"]+)["']""")
def extract_token_from_json(html):
    if not isinstance(html, str):
        import codecs
        html = codecs.decode(html, 'utf-8')
    match = token_in_json.search(html)
    return match.group(1)

# examples:
# "sessionid" : "NzlNoPfEYJahnPljE34xI0a5RSTaU1Aq1Cx5"
# 'sessionid':'NzlNoPfEYJahnPljE34xI0a5RSTaU1Aq1Cx5'
use_for_title_in_json = re.compile("""["']use_for_title["'] *: *(false|true)""")
def extract_use_for_title_from_json(html):
    if not isinstance(html, str):
        import codecs
        html = codecs.decode(html, 'utf-8')
    match = use_for_title_in_json.search(html)
    return match.group(1)


def autoload_url(server):
    return url(server) + \
        "autoload.js?bokeh-autoload-element=foo"

def resource_files_requested(response, requested=True):
    if not isinstance(response, str):
        import codecs
        response = codecs.decode(response, 'utf-8')
    for file in [
        'static/js/bokeh.min.js', 'static/js/bokeh-widgets.min.js']:
        if requested:
            assert file in response
        else:
            assert file not in response

def test_use_xheaders(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, use_xheaders=True) as server:
        assert server._http.xheaders == True

def test_ssl_args_plumbing(ManagedServerLoop) -> None:
    with mock.patch.object(ssl, 'SSLContext'):
        with ManagedServerLoop({}, ssl_certfile="foo") as server:
            assert server._http.ssl_options.load_cert_chain.call_args[0] == ()
            assert server._http.ssl_options.load_cert_chain.call_args[1] == dict(certfile='foo', keyfile=None, password=None)

    with mock.patch.object(ssl, 'SSLContext'):
        with ManagedServerLoop({}, ssl_certfile="foo", ssl_keyfile="baz") as server:
            assert server._http.ssl_options.load_cert_chain.call_args[0] == ()
            assert server._http.ssl_options.load_cert_chain.call_args[1] == dict(certfile='foo', keyfile="baz", password=None)

    with mock.patch.object(ssl, 'SSLContext'):
        with ManagedServerLoop({}, ssl_certfile="foo", ssl_keyfile="baz", ssl_password="bar") as server:
            assert server._http.ssl_options.load_cert_chain.call_args[0] == ()
            assert server._http.ssl_options.load_cert_chain.call_args[1] == dict(certfile='foo', keyfile="baz", password="bar")

# This test just maintains basic creation and setup, detailed functionality
# is exercised by Server tests above
def test_base_server() -> None:
    app = BokehTornado(Application())
    httpserver = HTTPServer(app)
    httpserver.start()

    loop = IOLoop()
    loop.make_current()

    server = BaseServer(loop, app, httpserver)
    server.start()

    assert server.io_loop == loop
    assert server._tornado.io_loop == loop

    httpserver.stop()
    server.stop()
    server.io_loop.close()

async def test_server_applications_callable_arg(ManagedServerLoop) -> None:
    def modify_doc(doc):
        doc.title = "Hello, world!"

    with ManagedServerLoop(modify_doc, port=0) as server:
        await http_get(server.io_loop, url(server))
        session = server.get_sessions('/')[0]
        assert session.document.title == "Hello, world!"

    with ManagedServerLoop({"/foo": modify_doc}, port=0) as server:
        await http_get(server.io_loop, url(server) + "foo")
        session = server.get_sessions('/foo')[0]
        assert session.document.title == "Hello, world!"

async def test__include_headers(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, include_headers=['Custom']) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = await http_get(server.io_loop, url(server), headers={'Custom': 'Test'})
        html = response.body
        token = extract_token_from_json(html)
        payload = get_token_payload(token)
        assert 'headers' in payload
        assert payload['headers'] == {'Custom': 'Test'}

async def test__exclude_headers(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, exclude_headers=['Connection', 'Host']) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = await http_get(server.io_loop, url(server))
        html = response.body
        token = extract_token_from_json(html)
        payload = get_token_payload(token)
        assert 'headers' in payload
        assert payload['headers'] == {'Accept-Encoding': 'gzip'}

async def test__include_cookies(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, include_cookies=['custom']) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = await http_get(server.io_loop, url(server), headers={'Cookie': 'custom = test ; custom2 = test2'})
        html = response.body
        token = extract_token_from_json(html)
        payload = get_token_payload(token)
        assert 'cookies' in payload
        assert payload['cookies'] == {'custom': 'test'}

async def test__exclude_cookies(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, exclude_cookies=['custom']) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = await http_get(server.io_loop, url(server), headers={'Cookie': 'custom = test ; custom2 = test2'})
        html = response.body
        token = extract_token_from_json(html)
        payload = get_token_payload(token)
        assert 'cookies' in payload
        assert payload['cookies'] == {'custom2': 'test2'}

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

@pytest.mark.skipif(sys.platform == "win32",
                    reason="Lifecycle hooks order different on Windows (TODO open issue)")
@flaky(max_runs=10)
def test__lifecycle_hooks(ManagedServerLoop) -> None:
    application = Application()
    handler = HookTestHandler()
    application.add(handler)
    with ManagedServerLoop(application, check_unused_sessions_milliseconds=30) as server:
        # wait for server callbacks to run before we mix in the
        # session, this keeps the test deterministic
        def check_done():
            if len(handler.hooks) == 4:
                server.io_loop.stop()
        server_load_checker = PeriodicCallback(check_done, 1)
        server_load_checker.start()
        server.io_loop.start()
        server_load_checker.stop()

        # now we create a session
        client_session = pull_session(session_id='test__lifecycle_hooks',
                                      url=url(server),
                                      io_loop=server.io_loop)
        client_doc = client_session.document
        assert len(client_doc.roots) == 1

        server_session = server.get_session('/', client_session.id)
        server_doc = server_session.document
        assert len(server_doc.roots) == 1

        # we have to capture these here for examination later, since after
        # the session is closed, doc.roots will be emptied
        client_hook_list = client_doc.roots[0]
        server_hook_list = server_doc.roots[0]

        client_session.close()
        # expire the session quickly rather than after the
        # usual timeout
        server_session.request_expiration()

        def on_done():
            server.io_loop.stop()

        server.io_loop.call_later(0.1, on_done)

        server.io_loop.start()

    assert handler.hooks == ["server_loaded",
                             "next_tick_server",
                             "timeout_server",
                             "periodic_server",
                             "session_created",
                             "modify",
                             "next_tick_session",
                             "timeout_session",
                             "periodic_session",
                             "session_destroyed",
                             "server_unloaded"]

    assert handler.load_count == 1
    assert handler.unload_count == 1
    # this is 3 instead of 6 because locked callbacks on destroyed sessions
    # are turned into no-ops
    assert handler.session_creation_async_value == 3
    assert client_doc.title == "Modified"
    assert server_doc.title == "Modified"
    # only the handler sees the event that adds "session_destroyed" since
    # the session is shut down at that point.
    assert client_hook_list.hooks == ["session_created", "modify"]
    assert server_hook_list.hooks == ["session_created", "modify"]

async def test__request_in_session_context(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        response = await http_get(server.io_loop, url(server) + "?foo=10")
        html = response.body
        token = extract_token_from_json(html)
        sessionid = get_session_id(token)

        server_session = server.get_session('/', sessionid)
        server_doc = server_session.document
        session_context = server_doc.session_context
        # do we have a request
        assert session_context.request is not None

async def test__request_in_session_context_has_arguments(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        response = await http_get(server.io_loop, url(server) + "?foo=10")
        html = response.body
        token = extract_token_from_json(html)
        sessionid = get_session_id(token)

        server_session = server.get_session('/', sessionid)
        server_doc = server_session.document
        session_context = server_doc.session_context
        # test if we can get the argument from the request
        assert session_context.request.arguments['foo'] == [b'10']

async def test__no_request_arguments_in_session_context(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        response = await http_get(server.io_loop, url(server))
        html = response.body
        token = extract_token_from_json(html)
        sessionid = get_session_id(token)

        server_session = server.get_session('/', sessionid)
        server_doc = server_session.document
        session_context = server_doc.session_context
        # if we do not pass any arguments to the url, the request arguments
        # should be empty
        assert len(session_context.request.arguments) == 0

@pytest.mark.parametrize("querystring,requested", [
    ("", True),
    ("&resources=default", True),
    ("&resources=whatever", True),
    ("&resources=none", False),
])

async def test__resource_files_requested(querystring, requested, ManagedServerLoop) -> None:
    """
    Checks if the loading of resource files is requested by the autoload.js
    response based on the value of the "resources" parameter.
    """
    application = Application()
    with ManagedServerLoop(application) as server:
        response = await http_get(server.io_loop, autoload_url(server) + querystring)
        resource_files_requested(response.body, requested=requested)

async def test__autocreate_session_autoload(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = await http_get(server.io_loop, autoload_url(server))
        js = response.body
        token = extract_token_from_json(js)
        sessionid = get_session_id(token)

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert sessionid == sessions[0].id

async def test__no_set_title_autoload(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = await http_get(server.io_loop, autoload_url(server))
        js = response.body
        use_for_title = extract_use_for_title_from_json(js)
        assert use_for_title == "false"

async def test__autocreate_session_doc(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = await http_get(server.io_loop, url(server))
        html = response.body
        token = extract_token_from_json(html)
        sessionid = get_session_id(token)

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert sessionid == sessions[0].id

async def test__no_autocreate_session_websocket(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        token = generate_jwt_token("")
        await websocket_open(server.io_loop, ws_url(server), subprotocols=["bokeh", token])

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

async def test__use_provided_session_autoload(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        response = await http_get(server.io_loop, autoload_url(server) + "&bokeh-session-id=" + expected)
        js = response.body
        token = extract_token_from_json(js)
        sessionid = get_session_id(token)
        assert expected == sessionid

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert expected == sessions[0].id

async def test__use_provided_session_header_autoload(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        response = await http_get(server.io_loop, autoload_url(server), headers={'Bokeh-Session-Id': expected})
        js = response.body
        token = extract_token_from_json(js)
        sessionid = get_session_id(token)
        assert expected == sessionid

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert expected == sessions[0].id

async def test__use_provided_session_autoload_token(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        expected_token = generate_jwt_token(expected)
        response = await http_get(server.io_loop, autoload_url(server) + "&bokeh-token=" + expected_token)
        js = response.body
        token = extract_token_from_json(js)
        assert expected_token == token
        sessionid = get_session_id(token)
        assert expected == sessionid

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert expected == sessions[0].id

async def test__use_provided_session_doc(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        response = await http_get(server.io_loop, url(server) + "?bokeh-session-id=" + expected)
        html = response.body
        token = extract_token_from_json(html)
        sessionid = get_session_id(token)
        assert expected == sessionid

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert expected == sessions[0].id

async def test__use_provided_session_websocket(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        token = generate_jwt_token(expected)
        await websocket_open(server.io_loop, ws_url(server), subprotocols=["bokeh", token])

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert expected == sessions[0].id

async def test__autocreate_signed_session_autoload(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, sign_sessions=True, secret_key='foo') as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = await http_get(server.io_loop, autoload_url(server))
        js = response.body
        token = extract_token_from_json(js)
        sessionid = get_session_id(token)

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert sessionid == sessions[0].id

        assert check_token_signature(token, signed=True, secret_key='foo')

async def test__autocreate_signed_session_doc(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, sign_sessions=True, secret_key='foo') as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = await http_get(server.io_loop, url(server))
        html = response.body
        token = extract_token_from_json(html)
        sessionid = get_session_id(token)

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert sessionid == sessions[0].id

        assert check_token_signature(token, signed=True, secret_key='foo')

@flaky(max_runs=10)
async def test__accept_session_websocket(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, session_token_expiration=1) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = await http_get(server.io_loop, url(server))
        html = response.body
        token = extract_token_from_json(html)

        ws = await websocket_open(server.io_loop, ws_url(server), subprotocols=["bokeh", token])
        msg = await ws.read_queue.get()
        assert isinstance(msg, str)
        assert 'ACK' in msg

async def test__reject_expired_session_websocket(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, session_token_expiration=1) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = await http_get(server.io_loop, url(server))
        html = response.body
        token = extract_token_from_json(html)

        time.sleep(1.1)

        ws = await websocket_open(server.io_loop, ws_url(server), subprotocols=["bokeh", token])
        assert await ws.read_queue.get() is None

async def test__reject_wrong_subprotocol_websocket(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = await http_get(server.io_loop, url(server))
        html = response.body
        token = extract_token_from_json(html)

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)

        ws = await websocket_open(server.io_loop, ws_url(server), subprotocols=["foo", token])
        assert await ws.read_queue.get() is None

async def test__reject_no_token_websocket(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        await http_get(server.io_loop, url(server))

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)

        ws = await websocket_open(server.io_loop, ws_url(server), subprotocols=["foo"])
        assert await ws.read_queue.get() is None

async def test__reject_unsigned_session_autoload(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, sign_sessions=True, secret_key='bar') as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        with (pytest.raises(HTTPError)) as info:
            await http_get(server.io_loop, autoload_url(server) + "&bokeh-session-id=" + expected)
        assert 'Invalid token or session ID' in repr(info.value)

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

async def test__reject_unsigned_token_autoload(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, sign_sessions=True, secret_key='bar') as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        token = generate_jwt_token(expected)
        with (pytest.raises(HTTPError)) as info:
            await http_get(server.io_loop, autoload_url(server) + "&bokeh-token=" + token)
        assert 'Invalid token or session ID' in repr(info.value)

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

async def test__reject_unsigned_session_doc(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, sign_sessions=True, secret_key='bar') as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        with (pytest.raises(HTTPError)) as info:
            await http_get(server.io_loop, url(server) + "?bokeh-session-id=" + expected)
        assert 'Invalid token or session ID' in repr(info.value)

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

async def test__reject_unsigned_session_header_doc(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, sign_sessions=True, secret_key='bar') as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        with (pytest.raises(HTTPError)) as info:
            await http_get(server.io_loop, url(server), headers={"Bokeh-Session-Id": expected})
        assert 'Invalid token or session ID' in repr(info.value)

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

async def test__reject_unsigned_session_websocket(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, sign_sessions=True, secret_key='bar') as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        token = generate_jwt_token(expected)
        await websocket_open(server.io_loop, ws_url(server), subprotocols=["bokeh", token])

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

async def test__no_generate_session_autoload(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, generate_session_ids=False) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        with (pytest.raises(HTTPError)) as info:
            await http_get(server.io_loop, autoload_url(server))
        assert 'No bokeh-session-id provided' in repr(info.value)

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

async def test__no_generate_session_doc(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, generate_session_ids=False) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        with (pytest.raises(HTTPError)) as info:
            await http_get(server.io_loop, url(server))
        assert 'No bokeh-session-id provided' in repr(info.value)

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

@pytest.mark.skipif(sys.platform == "win32",
                    reason="multiple processes not supported on Windows")
def test__server_multiple_processes() -> None:

    # Can't use an ioloop in this test
    with mock.patch('tornado.httpserver.HTTPServer.add_sockets'):
        with mock.patch('tornado.process.fork_processes') as tornado_fp:
            application = Application()
            server.Server(application, num_procs=3, port=0)

        tornado_fp.assert_called_with(3, mock.ANY)

def test__existing_ioloop_with_multiple_processes_exception(ManagedServerLoop, event_loop) -> None:
    application = Application()
    loop = IOLoop.current()
    with pytest.raises(RuntimeError):
        with ManagedServerLoop(application, io_loop=loop, num_procs=3):
            pass

async def test__actual_port_number(ManagedServerLoop) -> None:
    application = Application()
    with ManagedServerLoop(application, port=0) as server:
        port = server.port
        assert port > 0
        await http_get(server.io_loop, url(server))

def test__ioloop_not_forcibly_stopped() -> None:
    # Issue #5494
    application = Application()
    loop = IOLoop()
    loop.make_current()
    server = Server(application, io_loop=loop)
    server.start()
    result = []

    def f():
        server.unlisten()
        server.stop()
        # If server.stop() were to stop the Tornado IO loop,
        # g() wouldn't be called and `result` would remain empty.
        loop.add_timeout(timedelta(seconds=0.01), g)

    def g():
        result.append(None)
        loop.stop()

    loop.add_callback(f)
    loop.start()
    assert result == [None]

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
