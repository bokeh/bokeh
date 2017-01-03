import pytest

import bokeh.core.property.descriptor_factory as pf

class Child(pf.PropertyDescriptorFactory):
    pass

def test_autocreate():
    obj = Child()
    value = obj.autocreate()
    assert isinstance(value, Child)

def test_make_descriptors_not_implemented():
    obj = pf.PropertyDescriptorFactory()
    with pytest.raises(NotImplementedError):
        obj.make_descriptors("foo")
