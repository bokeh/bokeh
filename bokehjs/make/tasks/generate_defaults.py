# Standard library imports
import os
import sys
import warnings
from typing import Any
from os.path import dirname, join

# Bokeh imports
from bokeh.core.property.singletons import Undefined
from bokeh.core.serialization import Serializer, JSON
from bokeh.core.json_encoder import serialize_json
from bokeh.model import Model
from bokeh.util.warnings import BokehDeprecationWarning

import bokeh.models; bokeh.models # isort:skip

class DefaultsSerializer(Serializer):

    def _encode(self, obj: Any) -> JSON:
        if isinstance(obj, Model):
            rep = obj.struct
            properties = obj.properties_with_values(include_defaults=True)
            attributes = {key: self.to_serializable(val) for key, val in properties.items()}
            rep["attributes"] = attributes
            del rep["id"] # there's no way the ID will match bokehjs
            return rep
        elif obj is Undefined:
            return dict(type="symbol", name="unset")
        else:
            return super()._encode(obj)

dest_dir = sys.argv[1]

serializer = DefaultsSerializer()
all_json = {}

for name, model in Model.model_class_reverse_map.items():
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=BokehDeprecationWarning)
        obj = model()

    q = lambda prop: prop.readonly or prop.serialized
    properties = obj.query_properties_with_values(q, include_undefined=True)
    attributes = {key: serializer.to_serializable(val) for key, val in properties.items()}
    all_json[name] = attributes

def output_defaults_module(filename: str, defaults: Any) -> None:
    dest = join(dest_dir, ".generated_defaults", filename)
    os.makedirs(dirname(dest), exist_ok=True)

    output = serialize_json(defaults, indent=2)
    with open(dest, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"Wrote {filename} with {len(defaults)} models")

output_defaults_module("defaults.json", all_json)
