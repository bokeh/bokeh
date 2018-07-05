import pytest

from bokeh.core.properties import Int, String, List
from bokeh.model import Model
from bokeh.models.callbacks import CustomJS

class SomeModel(Model):
    a = Int(12)
    b = String("hello")
    c = List(Int, [1, 2, 3])

def test_model_js_on_change_exception_for_no_callbacks():
    m = SomeModel()
    with pytest.raises(ValueError):
        m.js_on_change('foo')

def test_model_js_on_change_exception_for_bad_callbacks():
    m = SomeModel()
    for val in [10, "bar", None, [1], {}, 10.2]:
        with pytest.raises(ValueError):
            m.js_on_change('foo', val)

def test_model_js_on_change_with_propname():
    cb = CustomJS(code="")
    m0 = SomeModel()
    for name in m0.properties():
        m = SomeModel()
        m.js_on_change(name, cb)
        assert m.js_property_callbacks == {"change:%s" % name: [cb]}

def test_model_js_on_change_with_non_propname():
    cb = CustomJS(code="")
    m1 = SomeModel()
    m1.js_on_change('foo', cb)
    assert m1.js_property_callbacks == {"foo": [cb]}

    m2 = SomeModel()
    m2.js_on_change('change:b', cb)
    assert m2.js_property_callbacks == {"change:b": [cb]}

def test_model_js_on_change_with_multple_callbacks():
    cb1 = CustomJS(code="")
    cb2 = CustomJS(code="")
    m = SomeModel()
    m.js_on_change('foo', cb1, cb2)
    assert m.js_property_callbacks == {"foo": [cb1, cb2]}

def test_model_js_on_change_with_multple_callbacks_separately():
    cb1 = CustomJS(code="")
    cb2 = CustomJS(code="")
    m = SomeModel()
    m.js_on_change('foo', cb1)
    assert m.js_property_callbacks == {"foo": [cb1]}
    m.js_on_change('foo', cb2)
    assert m.js_property_callbacks == {"foo": [cb1, cb2]}

def test_model_js_on_change_ignores_dupe_callbacks():
    cb = CustomJS(code="")
    m = SomeModel()
    m.js_on_change('foo', cb, cb)
    assert m.js_property_callbacks == {"foo": [cb]}

from bokeh.models import * # NOQA
from bokeh.plotting import * # NOQA
def test_all_builtin_models_default_constructible():
    bad = []
    for name, cls in Model.__class__.model_class_reverse_map.items():
        try:
            cls()
        except:
            bad.append(name)
        assert bad == []
