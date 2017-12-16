#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
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

from bokeh.util.api import DEV, GENERAL ; DEV, GENERAL
from bokeh.util.testing import verify_api ; verify_api

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
# API Definition
#-----------------------------------------------------------------------------

api = {

    GENERAL: (

    ), DEV: (

        ( 'ClientConnection',                     (1, 0, 0) ),
        ( 'ClientConnection.connected.fget',      (1, 0, 0) ),
        ( 'ClientConnection.io_loop.fget',        (1, 0, 0) ),
        ( 'ClientConnection.url.fget',            (1, 0, 0) ),
        ( 'ClientConnection.connect',             (1, 0, 0) ),
        ( 'ClientConnection.close',               (1, 0, 0) ),
        ( 'ClientConnection.force_roundtrip',     (1, 0, 0) ),
        ( 'ClientConnection.loop_until_closed',   (1, 0, 0) ),
        ( 'ClientConnection.pull_doc',            (1, 0, 0) ),
        ( 'ClientConnection.push_doc',            (1, 0, 0) ),
        ( 'ClientConnection.request_server_info', (1, 0, 0) ),
        ( 'ClientConnection.send_message',        (1, 0, 0) ),

    )

}

Test_api = verify_api(bcc, api)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

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
        assert c._until_predicate == None
        assert c._server_info == None

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
