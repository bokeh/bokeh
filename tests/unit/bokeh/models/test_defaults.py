#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from bokeh.core.property.singletons import Undefined
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

        for prop in model.properties():
            descriptor = model.lookup(prop)
            yield (model, name, descriptor)

@pytest.mark.parametrize("model, name, descriptor", list(all_descriptors()))
def test_default_values(model, name, descriptor) -> None:
    p = descriptor.property
    # In a few instances there is a default that needs to be prepared, e.g. by
    # an accepts clause. Use class_default rather than _raw_default.
    value = descriptor.class_default(model)
    if value is not Undefined:
        assert p.is_valid(value) is True, f"{name}.{descriptor.name} has an invalid default value {value!r}"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
