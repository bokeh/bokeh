import pytest

from bokeh.core.has_props import HasProps

import bokeh.core.property.bases as pb

def test_property_assert_bools():
    hp = HasProps()
    p = pb.Property()

    p.asserts(True, "true")
    assert p.prepare_value(hp, "foo", 10) == 10

    p.asserts(False, "false")
    with pytest.raises(ValueError) as e:
        p.prepare_value(hp, "foo", 10)
        assert str(e) == "false"

def test_property_assert_functions():
    hp = HasProps()
    p = pb.Property()

    p.asserts(lambda obj, value: True, "true")
    p.asserts(lambda obj, value: obj is hp, "true")
    p.asserts(lambda obj, value: value==10, "true")
    assert p.prepare_value(hp, "foo", 10) == 10

    p.asserts(lambda obj, value: False, "false")
    with pytest.raises(ValueError) as e:
        p.prepare_value(hp, "foo", 10)
        assert str(e) == "false"

def test_property_assert_msg_funcs():
    hp = HasProps()
    p = pb.Property()

    def raise_(ex):
        raise ex

    p.asserts(False, lambda obj, name, value: raise_(ValueError("bad %s %s %s" % (hp==obj, name, value))))

    with pytest.raises(ValueError) as e:
        p.prepare_value(hp, "foo", 10)
        assert str(e) == "bad True name, 10"
