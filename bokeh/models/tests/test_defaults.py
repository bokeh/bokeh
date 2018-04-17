from __future__ import absolute_import

import pytest

from bokeh import models
from bokeh.model import Model

def all_descriptors():
    for name in dir(models):
        model = getattr(models, name)

        try:
            if not issubclass(model, Model):
                continue
        except TypeError:
            continue

        for prop in model.properties(with_bases=False):
            descriptor = getattr(model, prop)
            yield (name, descriptor)

@pytest.mark.parametrize("name, descriptor", list(all_descriptors()))
@pytest.mark.unit
def test_default_values(name, descriptor):
    p = descriptor.property
    assert p.is_valid(p._raw_default()) is True, "%s.%s has an invalid default value" % (name, descriptor.name)
