# Standard library imports
import inspect
import os
import sys
import warnings
from json import loads

# Bokeh imports
import bokeh.models as models
from bokeh.core.json_encoder import serialize_json
from bokeh.model import Model
from bokeh.util.warnings import BokehDeprecationWarning

dest_dir = sys.argv[1]

classes = [member for name, member in inspect.getmembers(models) if inspect.isclass(member)]
model_class = next(klass for klass in classes if klass.__name__ == 'Model')

# getclasstree returns a list which contains [ (class, parentClass), [(subClassOfClass, class), ...]]
# where the subclass list is omitted if there are no subclasses.
# If you say unique=True then mixins will be registered as leaves so don't use unique=True,
# and expect to have duplicates in the result of leaves()
all_tree = inspect.getclasstree(classes, unique=False)

def leaves(tree, underneath):
    if len(tree) == 0:
        return []
    elif len(tree) > 1 and isinstance(tree[1], list):
        subs = tree[1]
        if underneath is None or tree[0][0] != underneath:
            return leaves(subs, underneath) + leaves(tree[2:], underneath)
        else:
            # underneath=None to return all leaves from here out
            return leaves(subs, underneath=None)
    else:
        leaf = tree[0]
        tail = tree[1:]
        if leaf[0] == underneath:
            return [leaf]
        elif underneath is not None:
            return leaves(tail, underneath)
        else:
            return [leaf] + leaves(tail, underneath)

all_json = {}
for leaf in leaves(all_tree, model_class):
    klass = leaf[0]
    vm_name = klass.__view_model__
    if vm_name in all_json:
        continue
    defaults = {}
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=BokehDeprecationWarning)
        instance = klass()
    props_with_values = instance.query_properties_with_values(lambda prop: prop.readonly or prop.serialized)
    for name, default in props_with_values.items():
        if isinstance(default, Model):
            struct = default.struct
            raw_attrs = default._to_json_like(include_defaults=True)
            attrs = loads(serialize_json(raw_attrs))
            struct['attributes'] = attrs
            del struct['id'] # there's no way the ID will match bokehjs
            default = struct
        elif isinstance(default, float) and default == float('inf'):
            default = None
        defaults[name] = default
    all_json[vm_name] = defaults

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
