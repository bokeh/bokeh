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
from tornado.ioloop import IOLoop

# Bokeh imports
from bokeh.client.states import NOT_YET_CONNECTED

# Module under test
import bokeh.client.connection as bcc

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class FakeSess(object):
    id = "session_id"

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Test_ClientConnection(object):

    def test_creation(self):
        c = bcc.ClientConnection("session", "wsurl")
        assert c.url == "wsurl"
        assert c.connected == False
        assert isinstance(c.io_loop, IOLoop)

        assert c._session == "session"
        assert isinstance(c._state, NOT_YET_CONNECTED)
        assert c._until_predicate is None
        assert c._server_info is None
        assert c._arguments is None

    def test_creation_with_arguments(self):
        c = bcc.ClientConnection("session", "wsurl", arguments=dict(foo="bar"))
        assert c.url == "wsurl"
        assert c.connected == False
        assert isinstance(c.io_loop, IOLoop)

        assert c._session == "session"
        assert isinstance(c._state, NOT_YET_CONNECTED)
        assert c._until_predicate is None
        assert c._server_info is None
        assert c._arguments == dict(foo="bar")

    def test__versioned_url(self):
        c = bcc.ClientConnection(FakeSess(), "wsurl")
        assert c._versioned_url() == "wsurl?bokeh-protocol-version=1.0&bokeh-session-id=session_id"

    def test__versioned_url_with_arguments(self):
        c = bcc.ClientConnection(FakeSess(), "wsurl", arguments=dict(foo="bar"))
        assert c._versioned_url() == "wsurl?bokeh-protocol-version=1.0&bokeh-session-id=session_id&foo=bar"

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
