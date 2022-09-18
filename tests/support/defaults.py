#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
import yaml

# Bokeh imports
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

import bokeh.models; bokeh.models # isort:skip

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
            properties = obj.properties_with_values(include_defaults=True)
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

    for name, model in Model.model_class_reverse_map.items():
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=BokehDeprecationWarning)
            obj = model()

        def query(prop: PropertyDescriptor[Any]) -> bool:
            return prop.readonly or prop.serialized

        properties = obj.query_properties_with_values(query, include_undefined=True)
        attributes = {key: serializer.encode(val) for key, val in properties.items()}
        defaults[name] = attributes

    return defaults

def output_defaults(dest: Path, defaults: dict[str, Any]) -> None:
    os.makedirs(dest.parent, exist_ok=True)

    #yaml.add_representer(
    #    tuple,
    #    lambda dumper, data: dumper.represent_list(data),
    #)

    output = yaml.dump(defaults, sort_keys=False, indent=2)
    with open(dest, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"Wrote {dest} with {len(defaults)} models")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
