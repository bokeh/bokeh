#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh.model import Model

# Module under test
from bokeh import models # isort:skip

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

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
def test_default_values(name, descriptor) -> None:
    p = descriptor.property
    assert p.is_valid(p._raw_default()) is True, "%s.%s has an invalid default value" % (name, descriptor.name)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
