import codecs
import inspect
from json import loads
import os
import sys

from bokeh.model import Model
import bokeh.models as models
from bokeh.core.json_encoder import serialize_json

dest_dir = sys.argv[1]

classes = [member for name, member in inspect.getmembers(models) if inspect.isclass(member)]

model_class = next(klass for klass in classes if klass.__name__ == 'Model')
widget_class = next(klass for klass in classes if klass.__name__ == 'Widget')

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
    instance = klass()
    props_with_values = instance.query_properties_with_values(lambda prop: prop.readonly or prop.serialized)
    for name, default in props_with_values.items():
        if isinstance(default, Model):
            ref = default.ref
            raw_attrs = default._to_json_like(include_defaults=True)
            attrs = loads(serialize_json(raw_attrs))
            ref['attributes'] = attrs
            del ref['id'] # there's no way the ID will match coffee
            default = ref
        elif isinstance(default, float) and default == float('inf'):
            default = None
        defaults[name] = default
    all_json[vm_name] = defaults

widgets_json = {}
for leaf_widget in leaves(all_tree, widget_class):
    klass = leaf_widget[0]
    vm_name = klass.__view_model__
    if vm_name not in widgets_json:
        widgets_json[vm_name] = all_json[vm_name]
        del all_json[vm_name]

def output_defaults_module(filename, defaults):
    output = serialize_json(defaults, indent=2)
    coffee_template = """\
all_defaults = %s

get_defaults = (name) ->
  if name of all_defaults
    all_defaults[name]
  else
    null

all_view_model_names = () ->
  Object.keys(all_defaults)

module.exports = {
  get_defaults: get_defaults
  all_view_model_names: all_view_model_names
}
"""
    try:
        os.makedirs(os.path.dirname(filename))
    except OSError:
        pass
    f = codecs.open(filename, 'w', 'utf-8')
    f.write(coffee_template % output)
    f.close()

    print("Wrote %s with %d model classes" % (filename, len(defaults)))


output_defaults_module(filename = os.path.join(dest_dir, 'common/generated_defaults/models_defaults.coffee'),
                       defaults = all_json)
output_defaults_module(filename = os.path.join(dest_dir, 'common/generated_defaults/widgets_defaults.coffee'),
                       defaults = widgets_json)
