from pytest import raises
from bokeh.models import CustomJS, Slider


def test_js_callback():
    slider = Slider()

    cb = CustomJS(code="foo();", args=dict(x=slider))
    assert 'foo()' in cb.code
    assert cb.args['x'] is slider

    cb = CustomJS(code="foo();", args=dict(x=3))
    assert 'foo()' in cb.code
    assert cb.args['x'] is 3

    with raises(AttributeError):  # kwargs not supported
        CustomJS(code="foo();", x=slider)


def test_py_callback():
    slider = Slider()
    foo = None  # fool pyflakes

    def cb(x=slider):
        foo()
    cb = CustomJS.from_py_func(cb)
    assert 'foo()' in cb.code
    assert cb.args['x'] is slider

    def cb(x=4):
        foo()
    cb = CustomJS.from_py_func(cb)
    assert 'foo()' in cb.code
    assert cb.args['x'] is 4
