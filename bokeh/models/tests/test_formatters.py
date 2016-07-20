from unittest import skipIf

try:
    from flexx import pyscript
    is_flexx = True
except ImportError as e:
    is_flexx = False

from bokeh.models import FuncTickFormatter

@skipIf(not is_flexx, "flexx not installed")
def test_functickformatter_from_py_func():

    def convert_to_minutes(seconds):
        return seconds * 60

    formatter = FuncTickFormatter.from_py_func(convert_to_minutes)
    js_code = pyscript.py2js(convert_to_minutes, 'formatter')

    function_wrapper = formatter.code.replace(js_code, '')

    assert function_wrapper == "function (seconds) {return formatter(seconds)};"
    assert formatter.lang == "javascript"
