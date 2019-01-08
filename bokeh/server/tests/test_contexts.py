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

# External imports

# Bokeh imports
from bokeh.application import Application

# Module under test
import bokeh.server.contexts as bsc

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestBokehServerContext(object):

    def test_init(self):
        ac = bsc.ApplicationContext("app", io_loop="ioloop")
        c = bsc.BokehServerContext(ac)
        assert c.application_context == ac

    def test_sessions(self):
        ac = bsc.ApplicationContext("app", io_loop="ioloop")
        ac._sessions = dict(foo=1, bar=2)
        c = bsc.BokehServerContext(ac)
        assert set(c.sessions) == set([1,2])

class TestBokehSessionContext(object):

    def test_init(self):
        ac = bsc.ApplicationContext("app", io_loop="ioloop")
        sc = bsc.BokehServerContext(ac)
        c = bsc.BokehSessionContext("id", sc, "doc")
        assert c.session is None
        assert c.request is None
        assert not c.destroyed

    def test_destroyed(self):
        class FakeSession(object):
            destroyed = False
        ac = bsc.ApplicationContext("app", io_loop="ioloop")
        sc = bsc.BokehServerContext(ac)
        c = bsc.BokehSessionContext("id", sc, "doc")
        sess = FakeSession()
        c._session = sess
        assert not c.destroyed
        sess.destroyed = True
        assert c.destroyed

class TestApplicationContext(object):

    def test_init(self):
        c = bsc.ApplicationContext("app", io_loop="ioloop")
        assert c.io_loop == "ioloop"
        assert c.application == "app"
        assert c.url is None

        c = bsc.ApplicationContext("app", io_loop="ioloop", url="url")
        assert c.io_loop == "ioloop"
        assert c.application == "app"
        assert c.url == "url"

    def test_sessions(self):
        c = bsc.ApplicationContext("app", io_loop="ioloop")
        c._sessions = dict(foo=1, bar=2)
        assert set(c.sessions) == set([1,2])

    def test_get_session_success(self):
        c = bsc.ApplicationContext("app", io_loop="ioloop")
        c._sessions = dict(foo=1, bar=2)
        assert c.get_session("foo") == 1

    def test_get_session_failure(self):
        c = bsc.ApplicationContext("app", io_loop="ioloop")
        c._sessions = dict(foo=1, bar=2)
        with pytest.raises(bsc.ProtocolError) as e:
            c.get_session("bax")
        assert str(e).endswith("No such session bax")

    def test_create_session_if_needed_new(self):
        app = Application()
        c = bsc.ApplicationContext(app, io_loop="ioloop")
        class FakeRequest(object):
            arguments = dict(foo=10)
        req = FakeRequest()
        s = c.create_session_if_needed("foo", request=req)
        assert c.get_session("foo") == s.result()

    def test_create_session_if_needed_exists(self):
        app = Application()
        c = bsc.ApplicationContext(app, io_loop="ioloop")
        class FakeRequest(object):
            arguments = dict(foo=10)
        req = FakeRequest()
        s1 = c.create_session_if_needed("foo", request=req)
        s2 = c.create_session_if_needed("foo", request=req)
        assert s1.result() == s2.result()

    def test_create_session_if_needed_bad_sessionid(self):
        app = Application()
        c = bsc.ApplicationContext(app, io_loop="ioloop")
        class FakeRequest(object):
            arguments = dict(foo=10)
        req = FakeRequest()
        r = c.create_session_if_needed("", request=req)
        with pytest.raises(bsc.ProtocolError) as e:
            r.result()
        assert str(e).endswith("Session ID must not be empty")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
