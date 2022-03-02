# Standard library imports
import os
import sys
import warnings
from typing import Any
from os.path import dirname, join

# Bokeh imports
from bokeh.core.property.singletons import Undefined
from bokeh.core.serialization import AnyRep, ObjectRep, Serializer, SymbolRep
from bokeh.core.json_encoder import serialize_json
from bokeh.model import Model
from bokeh.util.warnings import BokehDeprecationWarning

import bokeh.models; bokeh.models # isort:skip

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

dest_dir = sys.argv[1]

serializer = DefaultsSerializer()
all_json = {}

for name, model in Model.model_class_reverse_map.items():
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=BokehDeprecationWarning)
        obj = model()

    q = lambda prop: prop.readonly or prop.serialized
    properties = obj.query_properties_with_values(q, include_undefined=True)
    attributes = {key: serializer.encode(val) for key, val in properties.items()}
    all_json[name] = attributes

def output_defaults_module(filename: str, defaults: Any) -> None:
    dest = join(dest_dir, ".generated_defaults", filename)
    os.makedirs(dirname(dest), exist_ok=True)

    output = serialize_json(defaults, indent=2)
    with open(dest, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"Wrote {filename} with {len(defaults)} models")

output_defaults_module("defaults.json", all_json)
