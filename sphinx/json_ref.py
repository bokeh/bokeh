from __future__ import print_function

import importlib
import json

import jinja2

from bokeh.plot_object import PlotObject, Viewable
from bokeh.protocol import serialize_json

ITEM = jinja2.Template("""
.. code-block:: javascript

    {{ model_json|indent(4) }}
""")


module_names = [
    'bokeh.models.axes',
    'bokeh.models.formatters',
    'bokeh.models.glyphs',
    'bokeh.models.grids',
    'bokeh.models.map_plots',
    'bokeh.models.mappers',
    'bokeh.models.markers',
    'bokeh.models.plots',
    'bokeh.models.ranges',
    'bokeh.models.renderers',
    'bokeh.models.sources',
    'bokeh.models.tickers',
    'bokeh.models.tools',
    'bokeh.models.widget',
]

print("""

.. contents::
    :local:
    :depth: 2

Models
------
""")

for module_name in module_names:
    module = importlib.import_module(module_name)

    models = [x for x in vars(module).values() if type(x)==Viewable and x.__module__==module_name]
    models.sort(key=lambda x:x.__name__)

    print(".. _%s:" % module_name.replace('.', "_dot_"))
    print()

    header = "``%s``" % module_name
    print(header)
    print('-' * len(header))

    for m in models:

        model_json = json.dumps(
            json.loads(serialize_json(m().dump(changed_only=False))),
            sort_keys=True,
            indent=2,
            separators=(',', ': ')
        )

        print(
"""
.. autoclass:: %s.%s
    :members:
""" % (module_name, m.__name__))

        text = ITEM.render(
            model_json=model_json,
        )



        print(text)

    print()

