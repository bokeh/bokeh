#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
from typing import Any

# Bokeh imports
from bokeh.protocol.message import Message

# Module under test
import bokeh.client.states as bcs # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class MockConnection:
    state: Any

    def __init__(self, to_pop: Message[Any] | None = None) -> None:
        self.state = None
        self._to_pop = to_pop

    async def _connect_async(self):
        self.state = "_connect_async"
    async def _wait_for_ack(self):
        self.state = "_wait_for_ack"
    async def _handle_messages(self):
        self.state = "_handle_messages"
    async def _transition(self, arg: Any):
        self.state = ("_transition", arg)
    async def _transition_to_disconnected(self, arg: Any):
        self.state = "_transition_to_disconnected"
    async def _next(self):
        self.state = "_next"

    async def _pop_message(self):
        return self._to_pop

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
    c = MockConnection()
    await s.run(c)
    assert c.state == "_connect_async"

async def test_CONNECTED_BEFORE_ACK() -> None:
    s = bcs.CONNECTED_BEFORE_ACK()
    c = MockConnection()
    await s.run(c)
    assert c.state == "_wait_for_ack"

async def test_CONNECTED_AFTER_ACK() -> None:
    s = bcs.CONNECTED_AFTER_ACK()
    c = MockConnection()
    await s.run(c)
    assert c.state == "_handle_messages"

async def test_DISCONNECTED() -> None:
    s = bcs.DISCONNECTED()
    c = MockConnection()
    await s.run(c)
    assert c.state is None

async def test_WAITING_FOR_REPLY() -> None:
    s = bcs.WAITING_FOR_REPLY("reqid")
    assert s.reply == None
    assert s.reqid == "reqid"

    c = MockConnection()
    await s.run(c)
    assert c.state == "_transition_to_disconnected"
    assert s.reply is None

    m = MockMessage()
    c = MockConnection(to_pop=m)
    await s.run(c)
    assert c.state[0] == "_transition"
    assert isinstance(c.state[1], bcs.CONNECTED_AFTER_ACK)
    assert s.reply is m

    s._reqid = "nomatch"
    c = MockConnection(to_pop=m)
    await s.run(c)
    assert c.state == "_next"

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
