#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
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

# Module under test
import bokeh.client.states as bcs # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class MockConnection:
    def __init__(self, to_pop=None): self._to_pop = to_pop

    async def _connect_async(self): return "_connect_async"
    async def _wait_for_ack(self): return "_wait_for_ack"
    async def _handle_messages(self): return "_handle_messages"
    async def _transition(self, arg): return ("_transition", arg)
    async def _transition_to_disconnected(self): return "_transition_to_disconnected"
    async def _next(self): return "_next"

    async def _pop_message(self): return self._to_pop

class MockMessage:
    header = {'reqid': 'reqid'}

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


async def test_NOT_YET_CONNECTED() -> None:
    s = bcs.NOT_YET_CONNECTED()
    r = await s.run(MockConnection())
    assert r == "_connect_async"

async def test_CONNECTED_BEFORE_ACK() -> None:
    s = bcs.CONNECTED_BEFORE_ACK()
    r = await s.run(MockConnection())
    assert r == "_wait_for_ack"

async def test_CONNECTED_AFTER_ACK() -> None:
    s = bcs.CONNECTED_AFTER_ACK()
    r = await s.run(MockConnection())
    assert r == "_handle_messages"

async def test_DISCONNECTED() -> None:
    s = bcs.DISCONNECTED()
    r = await s.run(MockConnection())
    assert r is None

async def test_WAITING_FOR_REPLY() -> None:
    s = bcs.WAITING_FOR_REPLY("reqid")
    assert s.reply == None
    assert s.reqid == "reqid"

    r = await s.run(MockConnection(to_pop=None))
    assert r == "_transition_to_disconnected"
    assert s.reply is None

    m = MockMessage()
    r = await s.run(MockConnection(to_pop=m))
    assert r[0] == "_transition"
    assert isinstance(r[1], bcs.CONNECTED_AFTER_ACK)
    assert s.reply is m

    s._reqid = "nomatch"
    r = await s.run(MockConnection(to_pop=m))
    assert r == "_next"

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
