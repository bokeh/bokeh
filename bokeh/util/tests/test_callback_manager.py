from __future__ import absolute_import

from functools import partial

import pytest

import bokeh.util.callback_manager as cbm

class _GoodPropertyCallback(object):

    def __init__(self):
        self.last_name = None
        self.last_old = None
        self.last_new = None

    def __call__(self, name, old, new):
        self.method(name, old, new)

    def method(self, name, old, new):
        self.last_name = name
        self.last_old = old
        self.last_new = new

    def partially_good(self, name, old, new, newer):
        pass

    def just_fine(self, name, old, new, extra='default'):
        pass

class _BadPropertyCallback(object):

    def __call__(self, x, y):
        pass

    def method(self, x, y):
        pass

def _good_property(x, y, z):
    pass
def _bad_property(x, y):
    pass
def _partially_good_property(w, x, y, z):
    pass
def _just_fine_property(w, x, y, z='default'):
    pass

def test_property_creation():
    m = cbm.PropertyCallbackManager()
    assert len(m._callbacks) == 0

def test_property_on_change_good_method():
    m = cbm.PropertyCallbackManager()
    good = _GoodPropertyCallback()
    m.on_change('foo', good.method)
    assert len(m._callbacks) == 1
    assert m._callbacks['foo'] == [good.method]

def test_property_on_change_good_partial_function():
    m = cbm.PropertyCallbackManager()
    p = partial(_partially_good_property, 'foo')
    m.on_change('bar', p)
    assert len(m._callbacks) == 1


def test_property_on_change_good_partial_method():
    m = cbm.PropertyCallbackManager()
    good = _GoodPropertyCallback()
    p = partial(good.partially_good, 'foo')
    m.on_change('bar', p)
    assert len(m._callbacks) == 1

def test_property_on_change_good_extra_kwargs_function():
    m = cbm.PropertyCallbackManager()
    m.on_change('bar', _just_fine_property)
    assert len(m._callbacks) == 1

def test_property_on_change_good_extra_kwargs_method():
    m = cbm.PropertyCallbackManager()
    good = _GoodPropertyCallback()
    m.on_change('bar', good.just_fine)
    assert len(m._callbacks) == 1

def test_property_on_change_good_functor():
    m = cbm.PropertyCallbackManager()
    good = _GoodPropertyCallback()
    m.on_change('foo', good)
    assert len(m._callbacks) == 1
    assert m._callbacks['foo'] == [good]

def test_property_on_change_good_function():
    m = cbm.PropertyCallbackManager()
    m.on_change('foo', _good_property)
    assert len(m._callbacks) == 1
    assert m._callbacks['foo'] == [_good_property]

def test_property_on_change_good_lambda():
    m = cbm.PropertyCallbackManager()
    good = lambda x, y, z: x
    m.on_change('foo', good)
    assert len(m._callbacks) == 1
    assert m._callbacks['foo'] == [good]

def test_property_on_change_good_closure():
    def good(x, y, z):
        pass
    m = cbm.PropertyCallbackManager()
    m.on_change('foo', good)
    assert len(m._callbacks) == 1
    assert len(m._callbacks['foo']) == 1

def test_property_on_change_bad_method():
    m = cbm.PropertyCallbackManager()
    bad = _BadPropertyCallback()
    with pytest.raises(ValueError):
        m.on_change('foo', bad.method)
    assert len(m._callbacks) == 1
    assert len(m._callbacks['foo']) == 0

def test_property_on_change_bad_functor():
    m = cbm.PropertyCallbackManager()
    bad = _BadPropertyCallback()
    with pytest.raises(ValueError):
        m.on_change('foo', bad)
    assert len(m._callbacks) == 1
    assert len(m._callbacks['foo']) == 0

def test_property_on_change_bad_function():
    m = cbm.PropertyCallbackManager()
    with pytest.raises(ValueError):
        m.on_change('foo', _bad_property)
    assert len(m._callbacks) == 1
    assert len(m._callbacks['foo']) == 0

def test_property_on_change_bad_lambda():
    m = cbm.PropertyCallbackManager()
    with pytest.raises(ValueError):
        m.on_change('foo', lambda x, y: x)
    assert len(m._callbacks) == 1
    assert len(m._callbacks['foo']) == 0

def test_property_on_change_bad_closure():
    def bad(x, y):
        pass
    m = cbm.PropertyCallbackManager()
    with pytest.raises(ValueError):
        m.on_change('foo', bad)
    assert len(m._callbacks) == 1
    assert len(m._callbacks['foo']) == 0

def test_property_on_change_same_attr_twice_multiple_calls():
    def good1(x, y, z):
        pass

    def good2(x, y, z):
        pass
    m1 = cbm.PropertyCallbackManager()
    m1.on_change('foo', good1)
    m1.on_change('foo', good2)
    assert len(m1._callbacks) == 1
    assert m1._callbacks['foo'] == [good1, good2]

def test_property_on_change_same_attr_twice_one_call():
    def good1(x, y, z):
        pass

    def good2(x, y, z):
        pass
    m2 = cbm.PropertyCallbackManager()
    m2.on_change('foo', good1, good2)
    assert len(m2._callbacks) == 1
    assert m2._callbacks['foo'] == [good1, good2]

def test_property_on_change_different_attrs():
    def good1(x, y, z):
        pass

    def good2(x, y, z):
        pass
    m1 = cbm.PropertyCallbackManager()
    m1.on_change('foo', good1)
    m1.on_change('bar', good2)
    assert len(m1._callbacks) == 2
    assert m1._callbacks['foo'] == [good1]
    assert m1._callbacks['bar'] == [good2]

def test_property_trigger():
    m = cbm.PropertyCallbackManager()
    good = _GoodPropertyCallback()
    m.on_change('foo', good.method)
    m.trigger('foo', 42, 43)
    assert good.last_name == 'foo'
    assert good.last_old == 42
    assert good.last_new == 43

def test_property_trigger_with_two_callbacks():
    m = cbm.PropertyCallbackManager()
    good1 = _GoodPropertyCallback()
    good2 = _GoodPropertyCallback()
    m.on_change('foo', good1.method)
    m.on_change('foo', good2.method)
    m.trigger('foo', 42, 43)
    assert good1.last_name == 'foo'
    assert good1.last_old == 42
    assert good1.last_new == 43
    assert good2.last_name == 'foo'
    assert good2.last_old == 42
    assert good2.last_new == 43

# Tests for the EventCallbackManager

class _GoodEventCallback(object):

    def __init__(self):
        self.last_name = None
        self.last_old = None
        self.last_new = None

    def __call__(self, event):
        self.method(event)

    def method(self, event):
        self.event = event

    def partially_good(self, arg, event):
        pass

class _BadEventCallback(object):

    def __call__(self):
        pass

    def method(self):
        pass

def _good_event(event):
    pass
def _bad_event(x,y,z):
    pass
def _partially_good_event(arg, event):
    pass
def _partially_bad_event(event):
    pass

def test_event_creation():
    m = cbm.EventCallbackManager()
    assert len(m._event_callbacks) == 0

def test_event_on_change_good_method():
    m = cbm.EventCallbackManager()
    m.subscribed_events = []
    good = _GoodEventCallback()
    m.on_event('foo', good.method)
    assert len(m._event_callbacks) == 1
    assert m._event_callbacks['foo'] == [good.method]

def test_event_on_change_good_partial_function():
    m = cbm.EventCallbackManager()
    p = partial(_partially_good_event, 'foo')
    m.subscribed_events = []
    m.on_event('foo', p)
    assert len(m._event_callbacks) == 1
    assert m._event_callbacks['foo'] == [p]

def test_event_on_change_bad_partial_function():
    m = cbm.EventCallbackManager()
    p = partial(_partially_bad_event, 'foo')
    m.subscribed_events = []
    with pytest.raises(ValueError):
        m.on_event('foo', p)
    assert len(m._event_callbacks) == 0

def test_event_on_change_good_partial_method():
    m = cbm.EventCallbackManager()
    m.subscribed_events = []
    good = _GoodEventCallback()
    p = partial(good.partially_good, 'foo')
    m.on_event('foo', p)
    assert len(m._event_callbacks) == 1

def test_event_on_change_good_functor():
    m = cbm.EventCallbackManager()
    m.subscribed_events = []
    good = _GoodEventCallback()
    m.on_event('foo', good)
    assert len(m._event_callbacks) == 1
    assert m._event_callbacks['foo'] == [good]

def test_event_on_change_good_function():
    m = cbm.EventCallbackManager()
    m.subscribed_events = []
    m.on_event('foo', _good_event)
    assert len(m._event_callbacks) == 1
    assert m._event_callbacks['foo'] == [_good_event]

def test_event_on_change_good_lambda():
    m = cbm.EventCallbackManager()
    m.subscribed_events = []
    good = lambda event: event
    m.on_event('foo', good)
    assert len(m._event_callbacks) == 1
    assert m._event_callbacks['foo'] == [good]

def test_event_on_change_good_closure():
    def good(event):
        pass
    m = cbm.EventCallbackManager()
    m.subscribed_events = []
    m.on_event('foo', good)
    assert len(m._event_callbacks) == 1
    assert len(m._event_callbacks['foo']) == 1

def test_event_on_change_bad_method():
    m = cbm.EventCallbackManager()
    m.subscribed_events = []
    bad = _BadEventCallback()
    with pytest.raises(ValueError):
        m.on_event('foo', bad.method)
    assert len(m._event_callbacks) == 0

def test_event_on_change_bad_functor():
    m = cbm.EventCallbackManager()
    m.subscribed_events = []
    bad = _BadEventCallback()
    with pytest.raises(ValueError):
        m.on_event('foo', bad)
    assert len(m._event_callbacks) == 0

def test_event_on_change_bad_function():
    m = cbm.EventCallbackManager()
    m.subscribed_events = []
    with pytest.raises(ValueError):
        m.on_event('foo', _bad_event)
    assert len(m._event_callbacks) == 0

def test_event_on_change_bad_lambda():
    m = cbm.EventCallbackManager()
    m.subscribed_events = []
    with pytest.raises(ValueError):
        m.on_event('foo', lambda x, y: x)
    assert len(m._event_callbacks) == 0

def test_event_on_change_bad_closure():
    def bad(event, y):
        pass
    m = cbm.EventCallbackManager()
    m.subscribed_events = []
    with pytest.raises(ValueError):
        m.on_event('foo', bad)
    assert len(m._event_callbacks) == 0

def test_event_on_change_with_two_callbacks():
    m = cbm.EventCallbackManager()
    m.subscribed_events = []
    good1 = _GoodEventCallback()
    good2 = _GoodEventCallback()
    m.on_event('foo', good1.method)
    m.on_event('foo', good2.method)

def test_event_on_change_with_two_callbacks_one_bad():
    m = cbm.EventCallbackManager()
    m.subscribed_events = []
    good = _GoodEventCallback()
    bad = _BadEventCallback()
    with pytest.raises(ValueError):
        m.on_event('foo', good.method, bad.method)
