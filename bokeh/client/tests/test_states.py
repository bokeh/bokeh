from tornado import gen

import bokeh.client.states as bcs

class _MockConnection(object):
    def __init__(self, to_pop=None): self._to_pop = to_pop

    def _connect_async(self): raise gen.Return("_connect_async")
    def _wait_for_ack(self): raise gen.Return("_wait_for_ack")
    def _handle_messages(self): raise gen.Return("_handle_messages")
    def _transition(self, arg): raise gen.Return(("_transition", arg))
    def _transition_to_disconnected(self): raise gen.Return("_transition_to_disconnected")
    def _next(self): raise gen.Return("_next")

    @gen.coroutine
    def _pop_message(self): raise gen.Return(self._to_pop)

class _MockMessage(object):
    header = {'reqid': 'reqid'}

def test_NOT_YET_CONNECTED():
    s = bcs.NOT_YET_CONNECTED()
    r = s.run(_MockConnection())
    assert r.result() == "_connect_async"

def test_CONNECTED_BEFORE_ACK():
    s = bcs.CONNECTED_BEFORE_ACK()
    r = s.run(_MockConnection())
    assert r.result() == "_wait_for_ack"

def test_CONNECTED_AFTER_ACK():
    s = bcs.CONNECTED_AFTER_ACK()
    r = s.run(_MockConnection())
    assert r.result() == "_handle_messages"

def test_DISCONNECTED():
    s = bcs.DISCONNECTED()
    r = s.run(_MockConnection())
    assert r.result() is None

def test_WAITING_FOR_REPLY():
    s = bcs.WAITING_FOR_REPLY("reqid")
    assert s.reply == None
    assert s.reqid == "reqid"

    r = s.run(_MockConnection(to_pop=None))
    assert r.result() == "_transition_to_disconnected"
    assert s.reply is None

    m = _MockMessage()
    r = s.run(_MockConnection(to_pop=m))
    res = r.result()
    assert res[0] == "_transition"
    assert isinstance(res[1], bcs.CONNECTED_AFTER_ACK)
    assert s.reply is m

    s._reqid = "nomatch"
    r = s.run(_MockConnection(to_pop=m))
    assert r.result() == "_next"
