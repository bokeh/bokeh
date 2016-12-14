from __future__ import absolute_import

from bokeh.core.properties import Int, String
from bokeh.util.options import Options

class DummyOpts(Options):
    foo = String(default="thing")
    bar = Int()

def test_empty():
    empty = dict()
    o = DummyOpts(empty)
    assert o.foo == "thing"
    assert o.bar == None
    assert empty == {}

def test_exact():
    exact = dict(foo="stuff", bar=10)
    o = DummyOpts(exact)
    assert o.foo == "stuff"
    assert o.bar == 10
    assert exact == {}

def test_extra():
    extra = dict(foo="stuff", bar=10, baz=22.2)
    o = DummyOpts(extra)
    assert o.foo == "stuff"
    assert o.bar == 10
    assert extra == {'baz': 22.2}

def test_mixed():
    mixed = dict(foo="stuff", baz=22.2)
    o = DummyOpts(mixed)
    assert o.foo == "stuff"
    assert o.bar == None
    assert mixed == {'baz': 22.2}
