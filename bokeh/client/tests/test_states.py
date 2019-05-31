#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports

# Module under test
import bokeh.client.states as bcs

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class MockConnection(object):
    def __init__(self, to_pop=None): self._to_pop = to_pop

    def _connect_async(self): return "_connect_async"
    def _wait_for_ack(self): return "_wait_for_ack"
    def _handle_messages(self): return "_handle_messages"
    def _transition(self, arg): return ("_transition", arg)
    def _transition_to_disconnected(self): return "_transition_to_disconnected"
    def _next(self): return "_next"

    async def _pop_message(self): return self._to_pop

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

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
