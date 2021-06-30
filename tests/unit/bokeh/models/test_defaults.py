#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
            descriptor = getattr(model, prop)
            yield (name, descriptor)

@pytest.mark.parametrize("name, descriptor", list(all_descriptors()))
def test_default_values(name, descriptor) -> None:
    p = descriptor.property
    value = p._raw_default()
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
