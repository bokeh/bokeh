#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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

# Standard library imports
from typing import Any

# Bokeh imports
from bokeh.core.property.descriptors import PropertyDescriptor
from bokeh.core.property.enum import Enum
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
def test_default_values(model: type[Model], name: str, descriptor: PropertyDescriptor[Any]) -> None:
    p = descriptor.property
    # In a few instances there is a default that needs to be prepared, e.g. by
    # an accepts clause. Use class_default rather than _raw_default.
    value = descriptor.class_default(model)
    if value is not Undefined:
        assert p.is_valid(value) is True, f"{name}.{descriptor.name} has an invalid default value {value!r}"


def test_semantic_unit_companions() -> None:
    for model, model_name, descriptor in all_descriptors():
        units_type = getattr(descriptor.property, "units_type", None)
        if units_type is None:
            continue

        units_name = f"{descriptor.name}_units"
        assert model.lookup(units_name, raises=False) is None, \
            f"{model_name}.{descriptor.name} must embed units instead of defining {units_name}"
        assert isinstance(units_type, Enum)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
