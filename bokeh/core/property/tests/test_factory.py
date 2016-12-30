import pytest

import bokeh.core.property.factory as pf

class Child(pf.PropertyFactory):
    pass

def test_autocreate():
    obj = Child()
    value = obj.autocreate()
    assert isinstance(value, Child)

def test_make_descriptors_not_implemented():
    obj = pf.PropertyFactory()
    with pytest.raises(NotImplementedError):
        obj.make_descriptors("foo")
