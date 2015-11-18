
import sys

from pytest import raises, mark
from bokeh.models import CustomJS, Slider


def test_js_callback():
    
    slider = Slider()
    
    cb = CustomJS(code="foo();", args={'x': slider})
    assert cb.lang == 'javascript'
    assert 'foo()' in cb.code
    assert cb.args['x'] is slider
    
    with raises(ValueError):  # not a plot object
        CustomJS(code="foo();", args={'x': 3})
    
    with raises(AttributeError):  # kwargs not supported
        CustomJS(code="foo();", x=slider)


@mark.skipif(sys.version_info < (3, ), reason='requires Python 3')
def test_py_callback():
    
    slider = Slider()
    foo = None  # fool pyflakes
    
    @CustomJS
    def cb(x=slider):
        foo()
    assert cb.lang == 'javascript'
    assert 'foo()' in cb.code
    assert cb.args['x'] is slider
    
    with raises(ValueError):  # not a plot object
        @CustomJS
        def cb(x=4):
            foo()
