from __future__ import absolute_import

import pytest

import bokeh.util.callback_manager as cbm

class _Good(object):
    def __call__(self, x, y, z): pass
    def method(self, x, y, z): pass

class _Bad(object):
    def __call__(self, x, y): pass
    def method(self, x, y): pass

def _good(x,y,z): pass
def _bad(x,y): pass

def test_creation():
    m = cbm.CallbackManager()
    assert len(m._callbacks) == 0

def test_on_change_good_method():
    m = cbm.CallbackManager()
    good = _Good()
    m.on_change('foo', good.method)
    assert len(m._callbacks) == 1
    assert m._callbacks['foo'] == [good.method]

def test_on_change_good_functor():
    m = cbm.CallbackManager()
    good = _Good()
    m.on_change('foo', good)
    assert len(m._callbacks) == 1
    assert m._callbacks['foo'] == [good]

def test_on_change_good_function():
    m = cbm.CallbackManager()
    m.on_change('foo', _good)
    assert len(m._callbacks) == 1
    assert m._callbacks['foo'] == [_good]

def test_on_change_good_lambda():
    m = cbm.CallbackManager()
    good = lambda x, y, z: x
    m.on_change('foo', good)
    assert len(m._callbacks) == 1
    assert m._callbacks['foo'] == [good]

def test_on_change_good_closure():
    def good(x,y,z): pass
    m = cbm.CallbackManager()
    m.on_change('foo', good)
    assert len(m._callbacks) == 1
    assert len(m._callbacks['foo']) == 1

def test_on_change_bad_method():
    m = cbm.CallbackManager()
    bad = _Bad()
    with pytest.raises(ValueError):
        m.on_change('foo', bad.method)
    assert len(m._callbacks) == 1
    assert len(m._callbacks['foo']) == 0

def test_on_change_bad_functor():
    m = cbm.CallbackManager()
    bad = _Bad()
    with pytest.raises(ValueError):
        m.on_change('foo', bad)
    assert len(m._callbacks) == 1
    assert len(m._callbacks['foo']) == 0

def test_on_change_bad_function():
    m = cbm.CallbackManager()
    with pytest.raises(ValueError):
        m.on_change('foo', _bad)
    assert len(m._callbacks) == 1
    assert len(m._callbacks['foo']) == 0

def test_on_change_bad_lambda():
    m = cbm.CallbackManager()
    with pytest.raises(ValueError):
        m.on_change('foo', lambda x, y: x)
    assert len(m._callbacks) == 1
    assert len(m._callbacks['foo']) == 0

def test_on_change_bad_closure():
    def bad(x,y): pass
    m = cbm.CallbackManager()
    with pytest.raises(ValueError):
        m.on_change('foo', bad)
    assert len(m._callbacks) == 1
    assert len(m._callbacks['foo']) == 0

def test_on_change_same_attr_twice_multiple_calls():
    def good1(x,y,z): pass
    def good2(x,y,z): pass
    m1 = cbm.CallbackManager()
    m1.on_change('foo', good1)
    m1.on_change('foo', good2)
    assert len(m1._callbacks) == 1
    assert m1._callbacks['foo'] == [good1, good2]

def test_on_change_same_attr_twice_one_call():
    def good1(x,y,z): pass
    def good2(x,y,z): pass
    m2 = cbm.CallbackManager()
    m2.on_change('foo', good1, good2)
    assert len(m2._callbacks) == 1
    assert m2._callbacks['foo'] == [good1, good2]

def test_on_change_different_attrs():
    def good1(x,y,z): pass
    def good2(x,y,z): pass
    m1 = cbm.CallbackManager()
    m1.on_change('foo', good1)
    m1.on_change('bar', good2)
    assert len(m1._callbacks) == 2
    assert m1._callbacks['foo'] == [good1]
    assert m1._callbacks['bar'] == [good2]

def test_trigger():
    pass