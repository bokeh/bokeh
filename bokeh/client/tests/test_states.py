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
from tornado import gen


# Bokeh imports

# Module under test
import bokeh.client.states as bcs

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

api = {

    GENERAL: (

    ), DEV: (

        ( 'NOT_YET_CONNECTED',            (1, 0, 0) ),
        ( 'NOT_YET_CONNECTED.run',        (1, 0, 0) ),
        ( 'CONNECTED_BEFORE_ACK',         (1, 0, 0) ),
        ( 'CONNECTED_BEFORE_ACK.run',     (1, 0, 0) ),
        ( 'CONNECTED_AFTER_ACK',          (1, 0, 0) ),
        ( 'CONNECTED_AFTER_ACK.run',      (1, 0, 0) ),
        ( 'DISCONNECTED',                 (1, 0, 0) ),
        ( 'DISCONNECTED.run',             (1, 0, 0) ),
        ( 'WAITING_FOR_REPLY',            (1, 0, 0) ),
        ( 'WAITING_FOR_REPLY.reply.fget', (1, 0, 0) ),
        ( 'WAITING_FOR_REPLY.reqid.fget', (1, 0, 0) ),
        ( 'WAITING_FOR_REPLY.run',        (1, 0, 0) ),

    )

}

Test_api = verify_api(bcs, api)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class MockConnection(object):
    def __init__(self, to_pop=None): self._to_pop = to_pop

    def _connect_async(self): raise gen.Return("_connect_async")
    def _wait_for_ack(self): raise gen.Return("_wait_for_ack")
    def _handle_messages(self): raise gen.Return("_handle_messages")
    def _transition(self, arg): raise gen.Return(("_transition", arg))
    def _transition_to_disconnected(self): raise gen.Return("_transition_to_disconnected")
    def _next(self): raise gen.Return("_next")

    @gen.coroutine
    def _pop_message(self): raise gen.Return(self._to_pop)

class MockMessage(object):
    header = {'reqid': 'reqid'}

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_NOT_YET_CONNECTED():
    s = bcs.NOT_YET_CONNECTED()
    r = s.run(MockConnection())
    assert r.result() == "_connect_async"

def test_CONNECTED_BEFORE_ACK():
    s = bcs.CONNECTED_BEFORE_ACK()
    r = s.run(MockConnection())
    assert r.result() == "_wait_for_ack"

def test_CONNECTED_AFTER_ACK():
    s = bcs.CONNECTED_AFTER_ACK()
    r = s.run(MockConnection())
    assert r.result() == "_handle_messages"

def test_DISCONNECTED():
    s = bcs.DISCONNECTED()
    r = s.run(MockConnection())
    assert r.result() is None

def test_WAITING_FOR_REPLY():
    s = bcs.WAITING_FOR_REPLY("reqid")
    assert s.reply == None
    assert s.reqid == "reqid"

    r = s.run(MockConnection(to_pop=None))
    assert r.result() == "_transition_to_disconnected"
    assert s.reply is None

    m = MockMessage()
    r = s.run(MockConnection(to_pop=m))
    res = r.result()
    assert res[0] == "_transition"
    assert isinstance(res[1], bcs.CONNECTED_AFTER_ACK)
    assert s.reply is m

    s._reqid = "nomatch"
    r = s.run(MockConnection(to_pop=m))
    assert r.result() == "_next"

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
