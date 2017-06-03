from datetime import date
import json

import bokeh.models as bm; bm
import bokeh.models.widgets as bmw; bmw

from bokeh.model import Model

def _proto(obj, defaults=False):
    return json.dumps(obj.to_json(defaults), sort_keys=True, indent=None)

data = {}
for name, m in sorted(Model.__class__.model_class_reverse_map.items()):
    item = {
        'name'  : name,
        'bases' : [base.__module__ + '.' + base.__name__ for base in m.__bases__],
        'desc'  : m.__doc__.strip() if m.__doc__ is not None else '',
        'proto' : _proto(m(), True),
    }
    props = []
    for prop_name in m.properties():
        descriptor = m.lookup(prop_name)
        prop = descriptor.property

        detail = {
            'name'    : prop_name,
            'type'    : str(prop),
            'desc'    : prop.__doc__.strip() if prop.__doc__ is not None else '',
        }

        default = descriptor.instance_default(m())
        if isinstance(default, date):
            default = str(default)

        if isinstance(default, Model):
            default = _proto(default)

        if isinstance(default, (list, tuple)) and any(isinstance(x, Model) for x in default):
            default = [_proto(x) for x in default]

        if isinstance(default, dict) and any(isinstance(x, Model) for x in default.values()):
            default = { k: _proto(v) for k, v in default.items() }

        detail['default'] = default

        props.append(detail)

    item['props'] = props

    data[name] = item

print(json.dumps(data, indent=2))
