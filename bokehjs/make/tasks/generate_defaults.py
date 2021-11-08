# Standard library imports
import os
import sys
import warnings
from json import loads
from math import isinf, isnan
from typing import Any
from os.path import dirname, join

# Bokeh imports
from bokeh.core.json_encoder import serialize_json
from bokeh.core.property.singletons import Undefined
from bokeh.model import Model
from bokeh.util.warnings import BokehDeprecationWarning

import bokeh.models; bokeh.models # isort:skip

dest_dir = sys.argv[1]

all_json = {}
for name, model in Model.model_class_reverse_map.items():
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=BokehDeprecationWarning)
        obj = model()

    q = lambda prop: prop.readonly or prop.serialized
    attrs = obj.query_properties_with_values(q, include_undefined=True)

    for attr, v in attrs.items():
        if isinstance(v, Model):
            struct = v.struct
            raw_attrs = v._to_json_like(include_defaults=True)
            struct["attributes"] = loads(serialize_json(raw_attrs))
            del struct["id"] # there's no way the ID will match bokehjs
            attrs[attr] = struct
        elif v is Undefined:
            attrs[attr] = {"$type": "symbol", "name": "unset"}
        elif isinstance(v, float):
            # XXX this will happen in the serializer at some point
            if isnan(v):
                attrs[attr] = {"$type": "number", "value": "nan"}
            elif isinf(v):
                attrs[attr] = {"$type": "number", "value": f"{'-' if v < 0 else '+'}inf"}

    all_json[name] = attrs

def output_defaults_module(filename: str, defaults: Any) -> None:
    dest = join(dest_dir, ".generated_defaults", filename)
    os.makedirs(dirname(dest), exist_ok=True)

    output = serialize_json(defaults, indent=2)
    with open(dest, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"Wrote {filename} with {len(defaults)} models")

output_defaults_module("defaults.json", all_json)
