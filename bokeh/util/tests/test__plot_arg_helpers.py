from __future__ import absolute_import

import pytest

from bokeh.util._plot_arg_helpers import _convert_responsive

def test__convert_responsive_true():
    assert _convert_responsive(True) == 'scale_width'

def test__convert_responsive_false():
    assert _convert_responsive(False) == 'fixed'

def test__convert_responsive_error():
    with pytest.raises(ValueError):
        _convert_responsive("foo")
