import pytest

import bokeh.core.property.override as po

def test_create_default():
    o = po.Override(default=10)
    assert o.default_overridden
    assert o.default == 10

def test_create_no_args():
    with pytest.raises(ValueError):
        po.Override()

def test_create_unkown_args():
    with pytest.raises(ValueError):
        po.Override(default=10, junk=20)

    with pytest.raises(ValueError):
        po.Override(junk=20)
