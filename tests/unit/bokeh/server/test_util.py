#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
import socket

# Module under test
import bokeh.server.util as util # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_bind_sockets_with_zero_port() -> None:
    ss, port = util.bind_sockets("127.0.0.1", 0)
    assert isinstance(ss, list)
    assert len(ss) == 1
    assert isinstance(ss[0], socket.socket)
    assert isinstance(port, int)

def test_check_allowlist_rejects_port_mismatch() -> None:
    assert util.check_allowlist("foo:100", ["foo:101", "foo:102"]) is False

def test_check_allowlist_rejects_name_mismatch() -> None:
    assert util.check_allowlist("foo:100", ["bar:100", "baz:100"]) is False

def test_check_allowlist_accepts_name_port_match() -> None:
    assert util.check_allowlist("foo:100", ["foo:100", "baz:100"]) is True

def test_check_allowlist_accepts_implicit_port_80() -> None:
    assert util.check_allowlist("foo", ["foo:80"]) is True

def test_check_allowlist_accepts_all_on_star() -> None:
    assert util.check_allowlist("192.168.0.1", ['*']) is True
    assert util.check_allowlist("192.168.0.1:80", ['*']) is True
    assert util.check_allowlist("192.168.0.1:5006", ['*']) is True
    assert util.check_allowlist("192.168.0.1:80", ['*:80']) is True
    assert util.check_allowlist("192.168.0.1:80", ['*:81']) is False
    assert util.check_allowlist("192.168.0.1:5006", ['*:*']) is True
    assert util.check_allowlist("192.168.0.1", ['192.168.0.*']) is True
    assert util.check_allowlist("192.168.0.1:5006", ['192.168.0.*']) is True
    assert util.check_allowlist("192.168.1.1", ['192.168.0.*']) is False
    assert util.check_allowlist("foobarbaz", ['*']) is True
    assert util.check_allowlist("192.168.0.1", ['192.168.0.*']) is True
    assert util.check_allowlist("192.168.1.1", ['192.168.0.*']) is False
    assert util.check_allowlist("192.168.0.1", ['192.168.0.*:5006']) is False
    assert util.check_allowlist("192.168.0.1", ['192.168.0.*:80']) is True
    assert util.check_allowlist("foobarbaz", ['*']) is True
    assert util.check_allowlist("foobarbaz", ['*:*']) is True
    assert util.check_allowlist("foobarbaz", ['*:80']) is True
    assert util.check_allowlist("foobarbaz", ['*:5006']) is False
    assert util.check_allowlist("foobarbaz:5006", ['*']) is True
    assert util.check_allowlist("foobarbaz:5006", ['*:*']) is True
    assert util.check_allowlist("foobarbaz:5006", ['*:5006']) is True

def test_create_hosts_allowlist_no_host() -> None:
    hosts = util.create_hosts_allowlist(None, 1000)
    assert hosts == ["localhost:1000"]

    hosts = util.create_hosts_allowlist([], 1000)
    assert hosts == ["localhost:1000"]

def test_create_hosts_allowlist_host_value_with_port_use_port() -> None:
    hosts = util.create_hosts_allowlist(["foo:1000"], 1000)
    assert hosts == ["foo:1000"]

    hosts = util.create_hosts_allowlist(["foo:1000","bar:2100"], 1000)
    assert hosts == ["foo:1000","bar:2100"]

def test_create_hosts_allowlist_host_without_port_use_port_80() -> None:
    hosts = util.create_hosts_allowlist(["foo"], 1000)
    assert hosts == ["foo:80"]

    hosts = util.create_hosts_allowlist(["foo","bar"], 1000)
    assert hosts == ["foo:80","bar:80"]

def test_create_hosts_allowlist_host_non_int_port_raises() -> None:
    with pytest.raises(ValueError):
        util.create_hosts_allowlist(["foo:xyz"], 1000)

def test_create_hosts_allowlist_bad_host_raises() -> None:
    with pytest.raises(ValueError):
        util.create_hosts_allowlist([""], 1000)

    with pytest.raises(ValueError):
        util.create_hosts_allowlist(["a:b:c"], 1000)

    with pytest.raises(ValueError):
        util.create_hosts_allowlist([":80"], 1000)

def test_match_host() -> None:
        assert util.match_host('192.168.0.1:80', '192.168.0.1:80') is True
        assert util.match_host('192.168.0.1:80', '192.168.0.1') is True
        assert util.match_host('192.168.0.1:80', '192.168.0.1:8080') is False
        assert util.match_host('192.168.0.1', '192.168.0.2') is False
        assert util.match_host('192.168.0.1', '192.168.*.*') is True
        assert util.match_host('alice', 'alice') is True
        assert util.match_host('alice:80', 'alice') is True
        assert util.match_host('alice', 'bob') is False
        assert util.match_host('foo.example.com', 'foo.example.com.net') is False
        assert util.match_host('alice', '*') is True
        assert util.match_host('alice', '*:*') is True
        assert util.match_host('alice:80', '*') is True
        assert util.match_host('alice:80', '*:80') is True
        assert util.match_host('alice:8080', '*:80') is False

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
