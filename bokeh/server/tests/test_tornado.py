from __future__ import absolute_import, print_function

import logging

import bokeh.server.tornado as tornado

from bokeh.application import Application
from bokeh.client import pull_session

from .utils import ManagedServerLoop, url

logging.basicConfig(level=logging.DEBUG)

class _Handler(object):
    def prepare(self, *args, **kw): pass

def test__whitelist_replaces_prepare():
    h = _Handler()
    old_prepare = h.prepare
    tornado._whitelist(h)
    assert h.prepare != old_prepare
    assert hasattr(h.prepare, 'patched')

def test__whitelist_replaces_prepare_only_once():
    h = _Handler()
    tornado._whitelist(h)
    new_prepare = h.prepare
    tornado._whitelist(h)
    assert h.prepare == new_prepare

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
