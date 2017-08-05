from textwrap import dedent

import pytest

from bokeh.models import FuncTickFormatter, Slider

flexx = pytest.importorskip("flexx")

def test_functickformatter_from_py_func_no_args():

    def convert_to_minutes():
        return tick * 60 # noqa

    formatter = FuncTickFormatter.from_py_func(convert_to_minutes)
    js_code = flexx.pyscript.py2js(convert_to_minutes, 'formatter')

    function_wrapper = formatter.code.replace(js_code, '')

    assert function_wrapper == "return formatter();\n"

def test_functickformatter_from_py_func_with_args():

    slider = Slider()

    def convert_to_minutes(x=slider):
        return tick * 60 # noqa

    formatter = FuncTickFormatter.from_py_func(convert_to_minutes)
    js_code = flexx.pyscript.py2js(convert_to_minutes, 'formatter')

    function_wrapper = formatter.code.replace(js_code, '')

    assert function_wrapper == "return formatter(x);\n"
    assert formatter.args['x'] is slider

def test_functickformatter_bad_pyfunc_formats():
    def has_positional_arg(x):
        return None
    with pytest.raises(ValueError):
        FuncTickFormatter.from_py_func(has_positional_arg)

    def has_positional_arg_with_kwargs(y, x=5):
        return None
    with pytest.raises(ValueError):
        FuncTickFormatter.from_py_func(has_positional_arg_with_kwargs)

    def has_non_Model_keyword_argument(x=10):
        return None
    with pytest.raises(ValueError):
        FuncTickFormatter.from_py_func(has_non_Model_keyword_argument)

def test_functickformatter_from_coffeescript_no_arg():
    coffee_code = dedent("""
        square = (x) -> x * x
        return square(tick)
        """)

    formatter = FuncTickFormatter.from_coffeescript(code=coffee_code)

    assert formatter.code == dedent("""\
        var square;
        square = function (x) {
            return x * x;
        };
        return square(tick);
        """)
    assert formatter.args == {}

def test_functickformatter_from_coffeescript_with_args():
    coffee_code = dedent("""
         return slider.get("value") // 2 + tick
         """)

    slider = Slider()
    formatter = FuncTickFormatter.from_coffeescript(code=coffee_code, args={"slider": slider})

    assert formatter.code == dedent("""\
        return Math.floor(slider.get("value") / 2) + tick;
        """)
    assert formatter.args == {"slider": slider}
