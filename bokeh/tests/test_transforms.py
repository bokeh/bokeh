from textwrap import dedent

import pytest

from bokeh.models import CustomJSTransform, Slider

flexx = pytest.importorskip("flexx")

def test_customjstransform_from_py_func_no_args():

    def cosine():
        from flexx.pyscript import window
        return window.Math.cos(x) # noqa

    transform = CustomJSTransform.from_py_func(cosine)
    js_code = flexx.pyscript.py2js(cosine, 'transformer')

    function_wrapper = transform.code.replace(js_code, '')

    assert function_wrapper == "return transformer();\n"

def test_customjstransform_from_py_func_with_args():

    slider = Slider()

    def cosine(foo=slider):
        from flexx.pyscript import window
        return window.Math.cos(x) # noqa

    transform = CustomJSTransform.from_py_func(cosine)
    js_code = flexx.pyscript.py2js(cosine, 'transformer')

    function_wrapper = transform.code.replace(js_code, '')

    assert function_wrapper == "return transformer(foo);\n"
    assert transform.args['foo'] is slider

def test_customjstransform_bad_pyfunc_formats():
    def has_positional_arg(x):
        return None
    with pytest.raises(ValueError):
        CustomJSTransform.from_py_func(has_positional_arg)

    def has_positional_arg_with_kwargs(y, x=5):
        return None
    with pytest.raises(ValueError):
        CustomJSTransform.from_py_func(has_positional_arg_with_kwargs)

    def has_non_Model_keyword_argument(x=10):
        return None
    with pytest.raises(ValueError):
        CustomJSTransform.from_py_func(has_non_Model_keyword_argument)

def test_customjstransform_from_coffeescript_no_arg():
    coffee_code = dedent("""
        square = (a) -> a * a
        return square(a)
        """)

    transform = CustomJSTransform.from_coffeescript(code=coffee_code)

    assert transform.code == dedent("""\
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        var square;
        square = function (a) {
            return a * a;
        };
        return square(a);
        """)
    assert transform.args == {}

def test_customjstransform_from_coffeescript_with_args():
    coffee_code = dedent("""
         return slider.get("value") // 2 + x
         """)

    slider = Slider()
    formatter = CustomJSTransform.from_coffeescript(code=coffee_code, args={"slider": slider})

    assert formatter.code == dedent("""\
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        return Math.floor(slider.get("value") / 2) + x;
        """)
    assert formatter.args == {"slider": slider}
