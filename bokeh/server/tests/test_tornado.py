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