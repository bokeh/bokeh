#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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

# Module under test
import bokeh.client.util as bcu

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Test_server_url_for_websocket_url(object):

    def test_with_ws(self):
        assert bcu.server_url_for_websocket_url("ws://foo.com/ws") == "http://foo.com/"

    def test_with_wss(self):
        assert bcu.server_url_for_websocket_url("wss://foo.com/ws") == "https://foo.com/"

    def test_bad_proto(self):
        with pytest.raises(ValueError):
            bcu.server_url_for_websocket_url("junk://foo.com/ws")

    def test_bad_ending(self):
        with pytest.raises(ValueError):
            bcu.server_url_for_websocket_url("ws://foo.com/junk")
        with pytest.raises(ValueError):
            bcu.server_url_for_websocket_url("wss://foo.com/junk")

class Test_websocket_url_for_server_url(object):

    def test_with_http(self):
        assert bcu.websocket_url_for_server_url("http://foo.com") == "ws://foo.com/ws"
        assert bcu.websocket_url_for_server_url("http://foo.com/") == "ws://foo.com/ws"

    def test_with_https(self):
        assert bcu.websocket_url_for_server_url("https://foo.com") == "wss://foo.com/ws"
        assert bcu.websocket_url_for_server_url("https://foo.com/") == "wss://foo.com/ws"

    def test_bad_proto(self):
        with pytest.raises(ValueError):
            bcu.websocket_url_for_server_url("junk://foo.com")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
