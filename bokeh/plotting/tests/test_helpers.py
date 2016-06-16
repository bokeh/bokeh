from __future__ import absolute_import

import pytest

import bokeh.plotting.helpers as ph

def test__convert_responsive_true():
    assert ph._convert_responsive(True) == 'scale_width'

def test__convert_responsive_false():
    assert ph._convert_responsive(False) == 'fixed'

def test__convert_responsive_errot():
    with pytest.raises(ValueError):
        ph._convert_responsive("foo")