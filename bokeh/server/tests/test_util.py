#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import socket

# External imports

# Bokeh imports

# Module under test
import bokeh.server.util as util

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_bind_sockets_with_zero_port():
    ss, port = util.bind_sockets("127.0.0.1", 0)
    assert isinstance(ss, list)
    assert len(ss) == 1
    assert isinstance(ss[0], socket.socket)
    assert isinstance(port, int)

def test_check_whitelist_rejects_port_mismatch():
    assert False == util.check_whitelist("foo:100", ["foo:101", "foo:102"])

def test_check_whitelist_rejects_name_mismatch():
    assert False == util.check_whitelist("foo:100", ["bar:100", "baz:100"])

def test_check_whitelist_accepts_name_port_match():
    assert True == util.check_whitelist("foo:100", ["foo:100", "baz:100"])

def test_check_whitelist_accepts_implicit_port_80():
    assert True == util.check_whitelist("foo", ["foo:80"])

def test_check_whitelist_accepts_all_on_star():
    assert True == util.check_whitelist("192.168.0.1", ['*'])
    assert True == util.check_whitelist("192.168.0.1:80", ['*'])
    assert True == util.check_whitelist("192.168.0.1:5006", ['*'])
    assert True == util.check_whitelist("192.168.0.1:80", ['*:80'])
    assert False == util.check_whitelist("192.168.0.1:80", ['*:81'])
    assert True == util.check_whitelist("192.168.0.1:5006", ['*:*'])
    assert True == util.check_whitelist("192.168.0.1", ['192.168.0.*'])
    assert True == util.check_whitelist("192.168.0.1:5006", ['192.168.0.*'])
    assert False == util.check_whitelist("192.168.1.1", ['192.168.0.*'])
    assert True == util.check_whitelist("foobarbaz", ['*'])
    assert True == util.check_whitelist("192.168.0.1", ['192.168.0.*'])
    assert False == util.check_whitelist("192.168.1.1", ['192.168.0.*'])
    assert False == util.check_whitelist("192.168.0.1", ['192.168.0.*:5006'])
    assert True == util.check_whitelist("192.168.0.1", ['192.168.0.*:80'])
    assert True == util.check_whitelist("foobarbaz", ['*'])
    assert True == util.check_whitelist("foobarbaz", ['*:*'])
    assert True == util.check_whitelist("foobarbaz", ['*:80'])
    assert False == util.check_whitelist("foobarbaz", ['*:5006'])
    assert True == util.check_whitelist("foobarbaz:5006", ['*'])
    assert True == util.check_whitelist("foobarbaz:5006", ['*:*'])
    assert True == util.check_whitelist("foobarbaz:5006", ['*:5006'])

def test_create_hosts_whitelist_no_host():
    hosts = util.create_hosts_whitelist(None, 1000)
    assert hosts == ["localhost:1000"]

    hosts = util.create_hosts_whitelist([], 1000)
    assert hosts == ["localhost:1000"]

def test_create_hosts_whitelist_host_value_with_port_use_port():
    hosts = util.create_hosts_whitelist(["foo:1000"], 1000)
    assert hosts == ["foo:1000"]

    hosts = util.create_hosts_whitelist(["foo:1000","bar:2100"], 1000)
    assert hosts == ["foo:1000","bar:2100"]

def test_create_hosts_whitelist_host_without_port_use_port_80():
    hosts = util.create_hosts_whitelist(["foo"], 1000)
    assert hosts == ["foo:80"]

    hosts = util.create_hosts_whitelist(["foo","bar"], 1000)
    assert hosts == ["foo:80","bar:80"]

def test_create_hosts_whitelist_host_non_int_port_raises():
    with pytest.raises(ValueError):
        util.create_hosts_whitelist(["foo:xyz"], 1000)

def test_create_hosts_whitelist_bad_host_raises():
    with pytest.raises(ValueError):
        util.create_hosts_whitelist([""], 1000)

    with pytest.raises(ValueError):
        util.create_hosts_whitelist(["a:b:c"], 1000)

    with pytest.raises(ValueError):
        util.create_hosts_whitelist([":80"], 1000)

def test_match_host():
        assert util.match_host('192.168.0.1:80', '192.168.0.1:80') == True
        assert util.match_host('192.168.0.1:80', '192.168.0.1') == True
        assert util.match_host('192.168.0.1:80', '192.168.0.1:8080') == False
        assert util.match_host('192.168.0.1', '192.168.0.2') == False
        assert util.match_host('192.168.0.1', '192.168.*.*') == True
        assert util.match_host('alice', 'alice') == True
        assert util.match_host('alice:80', 'alice') == True
        assert util.match_host('alice', 'bob') == False
        assert util.match_host('foo.example.com', 'foo.example.com.net') == False
        assert util.match_host('alice', '*') == True
        assert util.match_host('alice', '*:*') == True
        assert util.match_host('alice:80', '*') == True
        assert util.match_host('alice:80', '*:80') == True
        assert util.match_host('alice:8080', '*:80') == False

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
