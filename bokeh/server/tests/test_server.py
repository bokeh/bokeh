from __future__ import absolute_import

import pytest

import bokeh.server.server as server

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
