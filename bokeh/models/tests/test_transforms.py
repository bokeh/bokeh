from textwrap import dedent

import pytest

from bokeh.models import CustomJSTransform, Slider

pscript = pytest.importorskip("pscript")

def test_customjstransform_from_py_func_no_args():

    def cosine():
        from pscript import window
        return window.Math.cos(x) # noqa

    def v_cosine():
        from pscript import window
        return [window.Math.cos(x) for x in xs] # noqa

    transform = CustomJSTransform.from_py_func(cosine, v_cosine)

    js_code = pscript.py2js(cosine, 'transformer')
    function_wrapper = transform.func.replace(js_code, '')
    assert function_wrapper == "return transformer();\n"

    v_js_code = pscript.py2js(v_cosine, 'transformer')
    v_function_wrapper = transform.v_func.replace(v_js_code, '')
    assert v_function_wrapper == "return transformer();\n"

def test_customjstransform_from_py_func_with_args():

    slider = Slider()

    def cosine(foo=slider):
        from pscript import window
        return window.Math.cos(x) # noqa

    def v_cosine(foo=slider):
        from pscript import window
        return [window.Math.cos(x) for x in xs] # noqa

    transform = CustomJSTransform.from_py_func(cosine, v_cosine)

    assert transform.args['foo'] is slider

    js_code = pscript.py2js(cosine, 'transformer')
    function_wrapper = transform.func.replace(js_code, '')
    assert function_wrapper == "return transformer(foo);\n"

    v_js_code = pscript.py2js(v_cosine, 'transformer')
    v_function_wrapper = transform.v_func.replace(v_js_code, '')
    assert v_function_wrapper == "return transformer(foo);\n"

def test_customjstransform_bad_pyfunc_formats():
    def foo():
        pass

    def has_positional_arg(x):
        return None
    with pytest.raises(ValueError):
        CustomJSTransform.from_py_func(has_positional_arg, foo)

    def has_positional_arg_with_kwargs(y, x=5):
        return None
    with pytest.raises(ValueError):
        CustomJSTransform.from_py_func(has_positional_arg_with_kwargs, foo)

    def has_non_Model_keyword_argument(x=10):
        return None
    with pytest.raises(ValueError):
        CustomJSTransform.from_py_func(has_non_Model_keyword_argument, foo)

def test_customjstransform_from_coffeescript_no_arg():
    code = "return x * x"
    v_code = "return [x * x for x in xs]"

    transform = CustomJSTransform.from_coffeescript(code, v_code)

    assert transform.func == dedent("""\
        return x * x;
        """)

    assert transform.v_func == dedent("""\
        var x;
        return [
            (function () {
                var i, len, results;
                results = [];
                for (i = 0, len = xs.length; i < len; i++) {
                    x = xs[i];
                    results.push(x * x);
                }
                return results;
            })()
        ];
        """)

    assert transform.args == {}

def test_customjstransform_from_coffeescript_with_args():
    code = "return foo.get('value') // 2 + x"
    v_code = "return [foo.get('value') // 2 + x for x in xs]"

    slider = Slider()
    formatter = CustomJSTransform.from_coffeescript(func=code, v_func=v_code, args={"foo": slider})

    assert formatter.func == dedent("""\
        return Math.floor(foo.get('value') / 2) + x;
        """)

    assert formatter.v_func == dedent("""\
        var x;
        return [
            (function () {
                var i, len, results;
                results = [];
                for (i = 0, len = xs.length; i < len; i++) {
                    x = xs[i];
                    results.push(Math.floor(foo.get('value') / 2) + x);
                }
                return results;
            })()
        ];
        """)

    assert formatter.args == {"foo": slider}
