from __future__ import absolute_import, print_function

import logging

import bokeh.server.tornado as tornado

from bokeh.application import Application
from bokeh.client import pull_session
from bokeh.server.views.static_handler import StaticHandler

from .utils import ManagedServerLoop, url

logging.basicConfig(level=logging.DEBUG)

def test_check_whitelist_rejects_port_mismatch():
    assert False == tornado.check_whitelist("foo:100", ["foo:101", "foo:102"])

def test_check_whitelist_rejects_name_mismatch():
    assert False == tornado.check_whitelist("foo:100", ["bar:100", "baz:100"])

def test_check_whitelist_accepts_name_port_match():
    assert True == tornado.check_whitelist("foo:100", ["foo:100", "baz:100"])

def test_check_whitelist_accepts_implicit_port_80():
    assert True == tornado.check_whitelist("foo", ["foo:80"])

def test_check_whitelist_accepts_all_on_star():
    assert True == tornado.check_whitelist("192.168.0.1", ['*'])
    assert True == tornado.check_whitelist("192.168.0.1:80", ['*'])
    assert True == tornado.check_whitelist("192.168.0.1:5006", ['*'])
    assert True == tornado.check_whitelist("192.168.0.1:80", ['*:80'])
    assert False == tornado.check_whitelist("192.168.0.1:80", ['*:81'])
    assert True == tornado.check_whitelist("192.168.0.1:5006", ['*:*'])
    assert True == tornado.check_whitelist("192.168.0.1", ['192.168.0.*'])
    assert True == tornado.check_whitelist("192.168.0.1:5006", ['192.168.0.*'])
    assert False == tornado.check_whitelist("192.168.1.1", ['192.168.0.*'])
    assert True == tornado.check_whitelist("foobarbaz", ['*'])
    assert True == tornado.check_whitelist("192.168.0.1", ['192.168.0.*'])
    assert False == tornado.check_whitelist("192.168.1.1", ['192.168.0.*'])
    assert False == tornado.check_whitelist("192.168.0.1", ['192.168.0.*:5006'])
    assert True == tornado.check_whitelist("192.168.0.1", ['192.168.0.*:80'])
    assert True == tornado.check_whitelist("foobarbaz", ['*'])
    assert True == tornado.check_whitelist("foobarbaz", ['*:*'])
    assert True == tornado.check_whitelist("foobarbaz", ['*:80'])
    assert False == tornado.check_whitelist("foobarbaz", ['*:5006'])
    assert True == tornado.check_whitelist("foobarbaz:5006", ['*'])
    assert True == tornado.check_whitelist("foobarbaz:5006", ['*:*'])
    assert True == tornado.check_whitelist("foobarbaz:5006", ['*:5006'])

def test_default_resources():
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

def test_default_app_paths():
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
def test_log_stats():
    application = Application()
    with ManagedServerLoop(application) as server:
        server._tornado.log_stats()
        session1 = pull_session(session_id='session1',
                                url=url(server),
                                io_loop=server.io_loop)
        session2 = pull_session(session_id='session2',
                                url=url(server),
                                io_loop=server.io_loop)
        server._tornado.log_stats()
        session1.close()
        session2.close()
        server._tornado.log_stats()
