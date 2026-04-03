#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys
from pathlib import Path
from unittest.mock import mock_open, patch

# External imports
from pytest import raises

# Bokeh imports
from bokeh.models import Slider

# Module under test
from bokeh.models import CustomJS # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_js_callback() -> None:
    slider = Slider()

    cb = CustomJS(code="foo();", args=dict(x=slider))
    assert 'foo()' in cb.code
    assert cb.args['x'] is slider

    cb = CustomJS(code="foo();", args=dict(x=3))
    assert 'foo()' in cb.code
    assert cb.args['x'] == 3

    with raises(AttributeError):  # kwargs not supported
        CustomJS(code="foo();", x=slider)

def test_CustomJS_from_code_mjs() -> None:
    slider = Slider()
    with patch("builtins.open", mock_open(read_data="export default () => 'ESM'")):
        cb = CustomJS.from_file(Path("some/module.mjs"), some="something", slider=slider)
    assert cb.module is True
    assert cb.code == "export default () => 'ESM'"
    assert cb.args == dict(some="something", slider=slider)

def test_CustomJS_from_code_js() -> None:
    slider = Slider()
    with patch("builtins.open", mock_open(read_data="return 'function'")):
        cb = CustomJS.from_file(Path("some/module.js"), some="something", slider=slider)
    assert cb.module is False
    assert cb.code == "return 'function'"
    assert cb.args == dict(some="something", slider=slider)

def test_CustomJS_from_code_bad_file_type() -> None:
    with pytest.raises(RuntimeError):
        CustomJS.from_file(Path("some/module.css"))

@pytest.mark.skipif(sys.version_info < (3, 14), reason="needs support for template literals")
def test_CustomJS_from_string_with_template() -> None:
    slider = Slider()

    cb0 = CustomJS.from_string("export default () => console.log('foo')")
    assert cb0.module == "auto"
    assert cb0.code == "export default () => console.log('foo')"
    assert cb0.args == dict()

    # TODO can't implement this directly, because it will cause SyntaxError earlier Pythons
    code = """CustomJS.from_string(t"export default () => console.log('foo: ' + {slider}.value)")"""
    cb1: CustomJS = eval(compile(code, "<test>", "eval"))
    assert cb1.module == "auto"
    assert cb1.code == "export default () => console.log('foo: ' + slider.value)"
    assert cb1.args == dict(slider=slider)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
