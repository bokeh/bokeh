# Standard library imports
import os
import sys
import warnings
from json import loads

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
    props_with_values = obj.query_properties_with_values(q, include_undefined=True)
    defaults = {}

    for attr, default in props_with_values.items():
        if isinstance(default, Model):
            struct = default.struct
            raw_attrs = default._to_json_like(include_defaults=True)
            attrs = loads(serialize_json(raw_attrs))
            struct["attributes"] = attrs
            del struct["id"] # there's no way the ID will match bokehjs
            default = struct
        elif default is Undefined:
            default = None # TODO: add support for unset values in bokehjs
        elif default == float("inf") or default == float("-inf"):
            default = None # TODO: add serialization support for +/-oo
        defaults[attr] = default

    all_json[name] = defaults

def output_defaults_module(filename, defaults):
    dest = os.path.join(dest_dir, ".generated_defaults", filename)

    try:
        os.makedirs(os.path.dirname(dest))
    except OSError:
        pass

    output = serialize_json(defaults, indent=2)

    with open(dest, "w", encoding="utf-8") as f:
        f.write(output)

    print("Wrote %s with %d models" % (filename, len(defaults)))

output_defaults_module("defaults.json", all_json)
