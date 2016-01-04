from __future__ import absolute_import

import pytest
import logging
import re

from tornado import gen
from tornado.ioloop import PeriodicCallback
from tornado.httpclient import HTTPError

import bokeh.server.server as server

from bokeh.application import Application
from bokeh.application.handlers import Handler
from bokeh.model import Model
from bokeh.core.properties import List, String
from bokeh.client import pull_session
from bokeh.util.session_id import generate_session_id, check_session_id_signature

from .utils import ManagedServerLoop, url, ws_url, http_get, websocket_open

logging.basicConfig(level=logging.DEBUG)

def test__create_hosts_whitelist_no_host():
    hosts = server._create_hosts_whitelist(None, 1000)
    assert hosts == ["localhost:1000"]

    hosts = server._create_hosts_whitelist([], 1000)
    assert hosts == ["localhost:1000"]

def test__create_hosts_whitelist_host_value_with_port_use_port():
    hosts = server._create_hosts_whitelist(["foo:1000"], 1000)
    assert hosts == ["foo:1000"]

    hosts = server._create_hosts_whitelist(["foo:1000","bar:2100"], 1000)
    assert hosts == ["foo:1000","bar:2100"]

def test__create_hosts_whitelist_host_without_port_use_port_80():
    hosts = server._create_hosts_whitelist(["foo"], 1000)
    assert hosts == ["foo:80"]

    hosts = server._create_hosts_whitelist(["foo","bar"], 1000)
    assert hosts == ["foo:80","bar:80"]

def test__create_hosts_whitelist_host_non_int_port_raises():
    with pytest.raises(ValueError):
        server._create_hosts_whitelist(["foo:xyz"], 1000)

def test__create_hosts_whitelist_bad_host_raises():
    with pytest.raises(ValueError):
        server._create_hosts_whitelist([""], 1000)

    with pytest.raises(ValueError):
        server._create_hosts_whitelist(["a:b:c"], 1000)

    with pytest.raises(ValueError):
        server._create_hosts_whitelist([":80"], 1000)

@gen.coroutine
def async_value(value):
    yield gen.moment # this ensures we actually return to the loop
    raise gen.Return(value)

class HookListModel(Model):
    hooks = List(String)

class HookTestHandler(Handler):
    def __init__(self):
        super(HookTestHandler, self).__init__()
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
        server_context.add_periodic_callback(self.on_periodic_server, 3)
        def remover():
            server_context.remove_periodic_callback(self.on_periodic_server)
        self.server_periodic_remover = remover

    def on_server_unloaded(self, server_context):
        self.unload_count += 1
        self.hooks.append("server_unloaded")

    # important to test that this can be async
    @gen.coroutine
    def on_session_created(self, session_context):
        @gen.coroutine
        def setup_document(doc):
            # session creation hook is allowed to init the document
            # before any modify_document() handlers kick in
            from bokeh.document import DEFAULT_TITLE
            hook_list = HookListModel()
            assert doc.title == DEFAULT_TITLE
            assert len(doc.roots) == 0
            hook_list.hooks.append("session_created")
            doc.add_root(hook_list)

            self.session_creation_async_value = yield async_value(1)
            self.session_creation_async_value = yield async_value(2)
            self.session_creation_async_value = yield async_value(3)

        yield session_context.with_locked_document(setup_document)

        server_context = session_context.server_context
        server_context.add_next_tick_callback(self.on_next_tick_session)
        server_context.add_timeout_callback(self.on_timeout_session, 2)
        server_context.add_periodic_callback(self.on_periodic_session, 3)
        def remover():
            server_context.remove_periodic_callback(self.on_periodic_session)
        self.session_periodic_remover = remover

        self.hooks.append("session_created")

    # this has to be async too
    @gen.coroutine
    def on_session_destroyed(self, session_context):
        @gen.coroutine
        def shutdown_document(doc):
            doc.roots[0].hooks.append("session_destroyed")
            self.session_creation_async_value = yield async_value(4)
            self.session_creation_async_value = yield async_value(5)
            self.session_creation_async_value = yield async_value(6)
        yield session_context.with_locked_document(shutdown_document)

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

def test__lifecycle_hooks():
    application = Application()
    handler = HookTestHandler()
    application.add(handler)
    with ManagedServerLoop(application, check_unused_sessions_milliseconds=20) as server:
        # wait for server callbacks to run before we mix in the
        # session, this keeps the test deterministic
        def check_done():
            if len(handler.hooks) == 4:
                server.io_loop.stop()
        server_load_checker = PeriodicCallback(check_done, 1,
                                               io_loop=server.io_loop)
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
                             "next_tick_session",
                             "modify",
                             "timeout_session",
                             "periodic_session",
                             "session_destroyed",
                             "server_unloaded"]

    client_hook_list = client_doc.roots[0]
    server_hook_list = server_doc.roots[0]
    assert handler.load_count == 1
    assert handler.unload_count == 1
    assert handler.session_creation_async_value == 6
    assert client_doc.title == "Modified"
    assert server_doc.title == "Modified"
    # the client session doesn't see the event that adds "session_destroyed" since
    # we shut down at that point.
    assert client_hook_list.hooks == ["session_created", "modify"]
    assert server_hook_list.hooks == ["session_created", "modify", "session_destroyed"]

# examples:
# "sessionid" : "NzlNoPfEYJahnPljE34xI0a5RSTaU1Aq1Cx5"
# 'sessionid':'NzlNoPfEYJahnPljE34xI0a5RSTaU1Aq1Cx5'
sessionid_in_json = re.compile("""["']sessionid["'] *: *["']([^"]+)["']""")
def extract_sessionid_from_json(html):
    from six import string_types
    if not isinstance(html, string_types):
        import codecs
        html = codecs.decode(html, 'utf-8')
    match = sessionid_in_json.search(html)
    return match.group(1)

def autoload_url(server):
    return url(server) + \
        "autoload.js?bokeh-protocol-version=1.0&bokeh-autoload-element=foo"

def test__autocreate_session_autoload():
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = http_get(server.io_loop,
                            autoload_url(server))
        js = response.body
        sessionid = extract_sessionid_from_json(js)

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert sessionid == sessions[0].id

def test__autocreate_session_doc():
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = http_get(server.io_loop,
                            url(server))
        html = response.body
        sessionid = extract_sessionid_from_json(html)

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert sessionid == sessions[0].id

def test__no_autocreate_session_websocket():
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        websocket_open(server.io_loop,
                       ws_url(server) + "?bokeh-protocol-version=1.0")

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

def test__use_provided_session_autoload():
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        response = http_get(server.io_loop,
                            autoload_url(server) + "&bokeh-session-id=" + expected)
        js = response.body
        sessionid = extract_sessionid_from_json(js)
        assert expected == sessionid

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert expected == sessions[0].id

def test__use_provided_session_doc():
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        response = http_get(server.io_loop,
                            url(server) + "?bokeh-session-id=" + expected)
        html = response.body
        sessionid = extract_sessionid_from_json(html)
        assert expected == sessionid

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert expected == sessions[0].id

def test__use_provided_session_websocket():
    application = Application()
    with ManagedServerLoop(application) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        url = ws_url(server) + \
              "?bokeh-protocol-version=1.0" + \
              "&bokeh-session-id=" + expected
        websocket_open(server.io_loop,
                       url)

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert expected == sessions[0].id

def test__autocreate_signed_session_autoload():
    application = Application()
    with ManagedServerLoop(application, sign_sessions=True, secret_key='foo') as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = http_get(server.io_loop,
                            autoload_url(server))
        js = response.body
        sessionid = extract_sessionid_from_json(js)

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert sessionid == sessions[0].id

        assert check_session_id_signature(sessionid, signed=True, secret_key='foo')

def test__autocreate_signed_session_doc():
    application = Application()
    with ManagedServerLoop(application, sign_sessions=True, secret_key='foo') as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        response = http_get(server.io_loop,
                            url(server))
        html = response.body
        sessionid = extract_sessionid_from_json(html)

        sessions = server.get_sessions('/')
        assert 1 == len(sessions)
        assert sessionid == sessions[0].id

        assert check_session_id_signature(sessionid, signed=True, secret_key='foo')

def test__reject_unsigned_session_autoload():
    application = Application()
    with ManagedServerLoop(application, sign_sessions=True, secret_key='bar') as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        with (pytest.raises(HTTPError)) as info:
            http_get(server.io_loop,
                     autoload_url(server) + "&bokeh-session-id=" + expected)
        assert 'Invalid session ID' in repr(info.value)

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

def test__reject_unsigned_session_doc():
    application = Application()
    with ManagedServerLoop(application, sign_sessions=True, secret_key='bar') as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        with (pytest.raises(HTTPError)) as info:
            response = http_get(server.io_loop,
                                url(server) + "?bokeh-session-id=" + expected)
        assert 'Invalid session ID' in repr(info.value)

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

def test__reject_unsigned_session_websocket():
    application = Application()
    with ManagedServerLoop(application, sign_sessions=True, secret_key='bar') as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        expected = 'foo'
        url = ws_url(server) + \
              "?bokeh-protocol-version=1.0" + \
              "&bokeh-session-id=" + expected
        websocket_open(server.io_loop,
                       url)

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

def test__no_generate_session_autoload():
    application = Application()
    with ManagedServerLoop(application, generate_session_ids=False) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        with (pytest.raises(HTTPError)) as info:
            http_get(server.io_loop,
                     autoload_url(server))
        assert 'No bokeh-session-id provided' in repr(info.value)

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

def test__no_generate_session_doc():
    application = Application()
    with ManagedServerLoop(application, generate_session_ids=False) as server:
        sessions = server.get_sessions('/')
        assert 0 == len(sessions)

        with (pytest.raises(HTTPError)) as info:
            response = http_get(server.io_loop,
                                url(server))
        assert 'No bokeh-session-id provided' in repr(info.value)

        sessions = server.get_sessions('/')
        assert 0 == len(sessions)
