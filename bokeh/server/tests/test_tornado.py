from __future__ import absolute_import

import bokeh.server.tornado as tornado

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