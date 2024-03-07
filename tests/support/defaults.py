#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Collect default values of all models' properties. """

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
import warnings
from pathlib import Path
from typing import Any

# External imports
import json5

# Bokeh imports
from bokeh.core.has_props import HasProps
from bokeh.core.property.descriptors import PropertyDescriptor
from bokeh.core.property.singletons import Undefined
from bokeh.core.serialization import (
    AnyRep,
    ObjectRep,
    Serializer,
    SymbolRep,
)
from bokeh.model import Model
from bokeh.util.warnings import BokehDeprecationWarning

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "collect_defaults",
    "output_defaults",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class DefaultsSerializer(Serializer):

    def _encode(self, obj: Any) -> AnyRep:
        if isinstance(obj, Model):
            def query(prop: PropertyDescriptor[Any]) -> bool:
                return prop.readonly or prop.serialized

            properties = obj.query_properties_with_values(query, include_defaults=False, include_undefined=True)
            attributes = {key: self.encode(val) for key, val in properties.items()}
            rep = ObjectRep(
                type="object",
                name=obj.__qualified_model__,
                attributes=attributes,
            )
            return rep
        elif obj is Undefined:
            return SymbolRep(type="symbol", name="unset")
        else:
            return super()._encode(obj)

def collect_defaults() -> dict[str, Any]:
    serializer = DefaultsSerializer()
    defaults: dict[str, Any] = {}

    # In order to look up from the model catalog that Model maintains, it
    # has to be created first. These imports ensure that all built-in Bokeh
    # models are represented in the catalog.
    import bokeh.models
    import bokeh.plotting  # noqa: F401

    models = sorted(Model.model_class_reverse_map.values(), key=lambda model: f"{model.__module__}.{model.__name__}")

    for model in models:
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=BokehDeprecationWarning)
            obj = model()

        # filter only own properties and overrides
        def query(prop: PropertyDescriptor[Any]) -> bool:
            return (prop.readonly or prop.serialized) and \
                (prop.name in obj.__class__.__properties__ or prop.name in obj.__class__.__overridden_defaults__)

        properties = obj.query_properties_with_values(query, include_defaults=True, include_undefined=True)
        attributes = {key: serializer.encode(val) for key, val in properties.items()}

        bases = [base.__qualified_model__ for base in model.__bases__ if issubclass(base, HasProps) and base != HasProps]
        if bases != []:
            attributes = dict(
                __extends__ = bases[0] if len(bases) == 1 else bases,
                **attributes,
            )

        name = model.__qualified_model__
        defaults[name] = attributes

    return defaults

def output_defaults(dest: Path, defaults: dict[str, Any]) -> None:
    os.makedirs(dest.parent, exist_ok=True)

    output = json5.dumps(defaults, sort_keys=False, indent=2)
    with open(dest, "w", encoding="utf-8") as f:
        f.write(output)
        f.write("\n")

    print(f"Wrote {dest} with {len(defaults)} models")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
